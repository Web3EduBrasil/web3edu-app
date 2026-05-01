export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-helper";
import fs from "fs";
import path from "path";

type Role = "student" | "admin" | "ai";

const QUESTIONS_COLLECTION = "qnaQuestions";
const REPLIES_COLLECTION = "replies";
const MAX_QUESTION_LENGTH = 600;
const MAX_REPLY_LENGTH = 1000;
const MAX_CONTEXT_CHARS = 2500;
const BLOCKED_TERMS = [
  "puta",
  "caralho",
  "merda",
  "idiota",
  "otario",
  "otário",
  "burro",
  "fdp",
  "porn",
  "sexo",
  "cassino",
  "aposta",
  "hack",
];

function parseBooleanParam(value: string | null): boolean {
  return value === "true" || value === "1";
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function toIso(value: any): string | null {
  if (!value) return null;
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

async function getAuthUser(uid: string) {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const roleField = (userData as any)?.role;
  const isAdminFlag = (userData as any)?.isAdmin === true;
  const isAdmin =
    isAdminFlag ||
    (typeof roleField === "string" && roleField.toLowerCase() === "admin");

  return {
    uid,
    displayName:
      (userData as any)?.displayName ||
      (userData as any)?.name ||
      (uid.startsWith("0x") ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : "Aluno"),
    photoURL: (userData as any)?.photoURL || "",
    role: (isAdmin ? "admin" : "student") as Role,
    isAdmin,
  };
}

function buildSectionContext(trailId: string, sectionId: string, sectionData: Record<string, any>) {
  const textParts: string[] = [];
  const title = normalizeText(sectionData?.title);
  const description = normalizeText(sectionData?.description);
  const question = normalizeText(sectionData?.question);
  const trailName = normalizeText(sectionData?.trailName);

  if (trailName) textParts.push(`Trilha: ${trailName}`);
  if (title) textParts.push(`Título da aula: ${title}`);
  if (description) textParts.push(`Descrição: ${description}`);
  if (question) textParts.push(`Pergunta da aula: ${question}`);

  const mdxPath = path.join(
    process.cwd(),
    "src",
    "contents",
    "trails",
    trailId,
    `${sectionId}.mdx`
  );
  if (fs.existsSync(mdxPath)) {
    const raw = fs.readFileSync(mdxPath, "utf-8");
    const clean = raw
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[^}]+\}/g, " ")
      .replace(/[#*_`>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CONTEXT_CHARS);
    if (clean) textParts.push(`Conteúdo da aula: ${clean}`);
  }

  return textParts.join("\n").slice(0, MAX_CONTEXT_CHARS);
}

async function moderateQuestion(
  genAI: GoogleGenerativeAI,
  questionText: string,
  context: string
): Promise<{ allowed: boolean; reason: string }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Você é um moderador de comunidade educacional.
Analise se a pergunta abaixo deve ser publicada.

Regras para permitir:
1) Sem insultos, assédio, palavrões e discurso de ódio.
2) Sem spam, propaganda e links maliciosos.
3) Deve estar relacionada ao conteúdo da aula/contexto.

Contexto da aula:
${context || "Sem contexto disponível"}

Pergunta do aluno:
${questionText}

Retorne APENAS JSON com:
{
  "allowed": boolean,
  "reason": "texto curto em pt-BR"
}`;

  const response = await model.generateContent(prompt);
  const raw = response.response.text().replace(/`json|`/g, "").trim();
  const parsed = JSON.parse(raw);
  return {
    allowed: Boolean(parsed.allowed),
    reason: typeof parsed.reason === "string" ? parsed.reason : "Pergunta rejeitada pela moderação.",
  };
}

function moderateQuestionFallback(questionText: string): { allowed: boolean; reason: string } {
  const normalized = questionText.toLowerCase();
  const hasBlockedTerm = BLOCKED_TERMS.some((term) => normalized.includes(term));
  if (hasBlockedTerm) {
    return {
      allowed: false,
      reason: "A pergunta contém termos inadequados para este ambiente.",
    };
  }
  if (normalized.length < 8) {
    return {
      allowed: false,
      reason: "A pergunta está muito curta. Descreva melhor sua dúvida.",
    };
  }
  return { allowed: true, reason: "Pergunta aprovada." };
}

/** Modelos suportados em v1beta para generateContent (evitar IDs obsoletos, ex.: gemini-1.5-flash-8b → 404). */
const GEMINI_REPLY_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
] as const;

function extractGeminiOutputText(result: { response: { text: () => string } }): string {
  const res = result.response as { text: () => string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  try {
    const direct = res.text();
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct.trim();
    }
  } catch {
    // Bloqueio, candidato vazio, etc. — tenta extrair manualmente.
  }
  const parts = res.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();
}

/** Resumo seguro do retorno do Gemini (sem conteúdo sensível completo). */
function summarizeGenerativeResult(result: unknown): Record<string, unknown> {
  try {
    const r = result as {
      response?: {
        promptFeedback?: unknown;
        candidates?: Array<{
          finishReason?: string;
          safetyRatings?: unknown;
          content?: { parts?: Array<Record<string, unknown>> };
        }>;
      };
    };
    const resp = r?.response;
    if (!resp) return { ok: false, reason: "no response object" };

    const c0 = resp.candidates?.[0];
    const parts = c0?.content?.parts;
    return {
      hasPromptFeedback: Boolean(resp.promptFeedback),
      promptFeedback: resp.promptFeedback ?? null,
      candidatesCount: resp.candidates?.length ?? 0,
      firstFinishReason: c0?.finishReason ?? null,
      firstSafetyRatings: c0?.safetyRatings ?? null,
      partKeys: Array.isArray(parts) ? parts.map((p) => Object.keys(p || {})) : [],
    };
  } catch {
    return { ok: false, reason: "summarize failed" };
  }
}

function logGeminiSdkError(scope: string, modelName: string, variantIndex: number, err: unknown) {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown> & {
      message?: string;
      name?: string;
      status?: number;
      statusText?: string;
      code?: number | string;
      cause?: unknown;
      stack?: string;
    };
    console.error(`[lesson-qna] ${scope}`, {
      model: modelName,
      variantIndex,
      message: e.message,
      name: e.name,
      status: e.status,
      statusText: e.statusText,
      code: e.code,
      cause: e.cause,
      stackHead: typeof e.stack === "string" ? e.stack.split("\n").slice(0, 6).join("\n") : null,
    });
  } else {
    console.error(`[lesson-qna] ${scope}`, { model: modelName, variantIndex, err });
  }
}

function buildReplyPrompt(questionText: string, contextSlice: string): string {
  return `Você é um assistente educacional de Web3 e blockchain.
Responda em pt-BR, com linguagem clara e objetiva, em no máximo 6 frases curtas.
Não invente fatos; se o contexto não for suficiente, diga isso e sugira o que revisar na aula.

Contexto da aula:
${contextSlice || "Sem contexto disponível"}

Pergunta do aluno:
${questionText}`;
}

async function generateAiReply(
  genAI: GoogleGenerativeAI,
  questionText: string,
  context: string
): Promise<string> {
  const contextFull = (context || "Sem contexto disponível").slice(0, MAX_CONTEXT_CHARS);
  const contextShort = contextFull.slice(0, 900);
  const promptVariants = [
    buildReplyPrompt(questionText, contextFull),
    buildReplyPrompt(questionText, contextShort),
    `Responda em pt-BR em até 6 frases curtas, de forma educacional, sobre Web3/blockchain.\n\nPergunta: ${questionText}`,
  ];

  let lastError: unknown;

  for (const modelName of GEMINI_REPLY_MODELS) {
    for (let vi = 0; vi < promptVariants.length; vi++) {
      const prompt = promptVariants[vi];
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.35 },
        });
        const response = await model.generateContent(prompt);
        const text = extractGeminiOutputText(response);
        if (text.length >= 20) {
          console.error("[lesson-qna] Gemini OK", { model: modelName, variantIndex: vi, outLen: text.length });
          return text.slice(0, MAX_REPLY_LENGTH);
        }
        lastError = new Error("Resposta da IA vazia ou muito curta");
        console.error("[lesson-qna] Gemini resposta vazia/curta", {
          model: modelName,
          variantIndex: vi,
          extractedLen: text.length,
          excerpt: text.slice(0, 120),
          summary: summarizeGenerativeResult(response),
        });
      } catch (e) {
        lastError = e;
        logGeminiSdkError("generateContent falhou", modelName, vi, e);
      }
    }
  }

  console.error("[lesson-qna] generateAiReply esgotou modelos/variantes", {
    modelsTried: [...GEMINI_REPLY_MODELS],
    variantsPerModel: promptVariants.length,
    lastError:
      lastError instanceof Error
        ? { message: lastError.message, name: lastError.name }
        : lastError,
  });

  throw lastError instanceof Error ? lastError : new Error("Falha ao gerar resposta com IA");
}

const MSG_AI_NO_API_KEY = `A resposta automática da IA não está disponível neste servidor (variável GEMINI_API_KEY não configurada). Sua pergunta foi publicada; outros alunos ou um moderador podem responder.`;

const MSG_AI_FAILED = `Não foi possível gerar a resposta automática da IA neste momento (instabilidade ou limite da API).`;

function buildContextualFallbackReply(questionText: string, context: string): string {
  const normalizedQuestion = questionText.toLowerCase();

  if (normalizedQuestion.includes("phishing") || normalizedQuestion.includes("phihing")) {
    return "Phishing é um golpe de engenharia social em que alguém se passa por uma entidade confiável para roubar dados, senhas ou acesso à carteira. Sempre confira URL, remetente e nunca assine/transfira sem validar a origem.";
  }

  const hasContext = context.replace(/\s+/g, " ").trim().length > 0;
  if (hasContext) {
    return "Revise os conceitos centrais desta aula e compare com sua pergunta; se quiser, reformule em uma frase objetiva que eu tento novamente com mais precisão.";
  }

  return "Não encontrei contexto suficiente para responder com segurança. Reformule a pergunta com mais detalhes para eu tentar novamente.";
}

function getQuestionRef(trailId: string, sectionId: string, questionId: string) {
  return adminDb
    .collection("trails")
    .doc(trailId)
    .collection("contents")
    .doc(sectionId)
    .collection(QUESTIONS_COLLECTION)
    .doc(questionId);
}

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");
    const sectionId = req.nextUrl.searchParams.get("sectionId");
    const questionId = req.nextUrl.searchParams.get("questionId");
    const includeReplies = parseBooleanParam(req.nextUrl.searchParams.get("includeReplies"));

    if (!trailId || !sectionId) {
      return NextResponse.json(
        { message: "Parâmetros obrigatórios: trailId e sectionId" },
        { status: 400 }
      );
    }

    const questionsRef = adminDb
      .collection("trails")
      .doc(trailId)
      .collection("contents")
      .doc(sectionId)
      .collection(QUESTIONS_COLLECTION);

    if (questionId) {
      const questionDoc = await questionsRef.doc(questionId).get();
      if (!questionDoc.exists) {
        return NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
      }

      const questionData = questionDoc.data() || {};
      const payload: any = {
        id: questionDoc.id,
        ...questionData,
        createdAt: toIso(questionData.createdAt),
        updatedAt: toIso(questionData.updatedAt),
        lastActivityAt: toIso(questionData.lastActivityAt),
      };

      if (includeReplies) {
        const repliesSnap = await questionsRef
          .doc(questionId)
          .collection(REPLIES_COLLECTION)
          .orderBy("createdAt", "asc")
          .get();

        payload.replies = repliesSnap.docs.map((reply) => {
          const replyData = reply.data();
          return {
            id: reply.id,
            ...replyData,
            createdAt: toIso(replyData.createdAt),
            updatedAt: toIso(replyData.updatedAt),
          };
        });
      }

      return NextResponse.json({ question: payload }, { status: 200 });
    }

    const questionsSnap = await questionsRef.orderBy("lastActivityAt", "desc").get();
    const questions = questionsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        lastActivityAt: toIso(data.lastActivityAt),
      };
    });

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao buscar Q&A:", error);
    return NextResponse.json({ message: "Erro ao buscar Q&A" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try {
    verifiedUid = await verifyAuth(req);
  } catch {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const trailId = normalizeText(body?.trailId);
    const sectionId = normalizeText(body?.sectionId);
    const content = normalizeText(body?.content);
    const type = normalizeText(body?.type) || "question";
    const questionId = normalizeText(body?.questionId);
    const askAi = Boolean(body?.askAi);

    if (!trailId || !sectionId || !content) {
      return NextResponse.json(
        { message: "Parâmetros obrigatórios: trailId, sectionId e content" },
        { status: 400 }
      );
    }

    const user = await getAuthUser(verifiedUid);

    if (type === "question") {
      if (content.length > MAX_QUESTION_LENGTH) {
        return NextResponse.json(
          { message: `Pergunta muito longa (máximo ${MAX_QUESTION_LENGTH} caracteres)` },
          { status: 400 }
        );
      }

      const sectionDoc = await adminDb
        .collection("trails")
        .doc(trailId)
        .collection("contents")
        .doc(sectionId)
        .get();
      const sectionData = sectionDoc.exists ? sectionDoc.data() || {} : {};
      const context = buildSectionContext(trailId, sectionId, sectionData);

      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

      let moderation = moderateQuestionFallback(content);
      if (genAI) {
        try {
          moderation = await moderateQuestion(genAI, content, context);
        } catch (error) {
          console.warn("Falha na moderação por IA, usando fallback local:", error);
        }
      }

      if (!moderation.allowed) {
        return NextResponse.json(
          { message: "Pergunta bloqueada pela moderação", reason: moderation.reason },
          { status: 400 }
        );
      }

      const now = new Date();
      const questionsRef = adminDb
        .collection("trails")
        .doc(trailId)
        .collection("contents")
        .doc(sectionId)
        .collection(QUESTIONS_COLLECTION);

      const questionRef = await questionsRef.add({
        content,
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhotoURL: user.photoURL,
        authorRole: user.role,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        replyCount: 0,
      });

      let askAiDebug: Record<string, unknown> | undefined;
      const isDevServer = process.env.NODE_ENV === "development";

      if (askAi) {
        const runId = randomUUID();
        let aiReply: string;
        let fromRealModel = false;

        if (!genAI) {
          aiReply = MSG_AI_NO_API_KEY;
          if (isDevServer) {
            askAiDebug = { runId, aiReplied: false, reason: "no_api_key" };
          }
          console.error("[lesson-qna] askAi sem chave Gemini", runId);
        } else {
          try {
            console.error("[lesson-qna] askAi início (logs no terminal do servidor, não no navegador)", runId, {
              trailId,
              sectionId,
              questionLen: content.length,
              contextLen: context.length,
            });
            aiReply = await generateAiReply(genAI, content, context);
            fromRealModel = true;
            if (isDevServer) {
              askAiDebug = { runId, aiReplied: true };
            }
            console.error("[lesson-qna] askAi sucesso", runId, { outLen: aiReply.length });
          } catch (error) {
            logGeminiSdkError("Falha final askAi (após generateAiReply)", "—", -1, error);
            aiReply = `${MSG_AI_FAILED} ${buildContextualFallbackReply(content, context)}`;
            if (isDevServer) {
              const err = error instanceof Error ? error : new Error(String(error));
              askAiDebug = {
                runId,
                aiReplied: false,
                reason: "generateAiReply_failed",
                errorName: err.name,
                errorMessage: err.message.slice(0, 400),
              };
            }
            console.error("[lesson-qna] askAi usando fallback", runId, {
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await questionRef.collection(REPLIES_COLLECTION).add({
          content: aiReply,
          authorUid: "ai-assistant",
          authorName: "Assistente IA",
          authorPhotoURL: "",
          authorRole: "ai",
          createdAt: now,
          updatedAt: now,
        });
        await questionRef.update({
          replyCount: 1,
          lastActivityAt: now,
          aiReplied: fromRealModel,
        });
      }

      return NextResponse.json(
        {
          message: "Pergunta publicada",
          questionId: questionRef.id,
          ...(askAi && askAiDebug ? { askAiDebug } : {}),
        },
        { status: 201 }
      );
    }

    if (type === "reply") {
      if (!questionId) {
        return NextResponse.json(
          { message: "questionId é obrigatório para responder" },
          { status: 400 }
        );
      }
      if (content.length > MAX_REPLY_LENGTH) {
        return NextResponse.json(
          { message: `Resposta muito longa (máximo ${MAX_REPLY_LENGTH} caracteres)` },
          { status: 400 }
        );
      }

      const questionRef = getQuestionRef(trailId, sectionId, questionId);
      const questionDoc = await questionRef.get();
      if (!questionDoc.exists) {
        return NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
      }

      const now = new Date();
      await questionRef.collection(REPLIES_COLLECTION).add({
        content,
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhotoURL: user.photoURL,
        authorRole: user.role,
        createdAt: now,
        updatedAt: now,
      });

      await questionRef.update({
        replyCount: (questionDoc.data()?.replyCount || 0) + 1,
        lastActivityAt: now,
      });

      return NextResponse.json({ message: "Resposta publicada" }, { status: 201 });
    }

    return NextResponse.json({ message: "Tipo inválido. Use question ou reply." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao publicar Q&A:", error);
    return NextResponse.json({ message: "Erro ao publicar conteúdo" }, { status: 500 });
  }
};

export const PATCH = async (req: NextRequest) => {
  let verifiedUid: string;
  try {
    verifiedUid = await verifyAuth(req);
  } catch {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const trailId = normalizeText(body?.trailId);
    const sectionId = normalizeText(body?.sectionId);
    const questionId = normalizeText(body?.questionId);
    const replyId = normalizeText(body?.replyId);
    const content = normalizeText(body?.content);
    const type = normalizeText(body?.type);

    if (!trailId || !sectionId || !questionId || !content || !type) {
      return NextResponse.json(
        { message: "Parâmetros obrigatórios: trailId, sectionId, questionId, type e content" },
        { status: 400 }
      );
    }

    const user = await getAuthUser(verifiedUid);
    const now = new Date();
    const questionRef = getQuestionRef(trailId, sectionId, questionId);

    if (type === "question") {
      const questionDoc = await questionRef.get();
      if (!questionDoc.exists) {
        return NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
      }
      const data = questionDoc.data() || {};
      const isOwner = data.authorUid === user.uid;
      if (!isOwner && !user.isAdmin) {
        return NextResponse.json({ message: "Sem permissão para editar esta pergunta" }, { status: 403 });
      }
      await questionRef.update({ content, updatedAt: now });
      return NextResponse.json({ message: "Pergunta atualizada" }, { status: 200 });
    }

    if (type === "reply") {
      if (!replyId) {
        return NextResponse.json({ message: "replyId é obrigatório para editar resposta" }, { status: 400 });
      }
      const replyRef = questionRef.collection(REPLIES_COLLECTION).doc(replyId);
      const replyDoc = await replyRef.get();
      if (!replyDoc.exists) {
        return NextResponse.json({ message: "Resposta não encontrada" }, { status: 404 });
      }
      const data = replyDoc.data() || {};
      const isOwner = data.authorUid === user.uid;
      if (!isOwner && !user.isAdmin) {
        return NextResponse.json({ message: "Sem permissão para editar esta resposta" }, { status: 403 });
      }
      await replyRef.update({ content, updatedAt: now });
      return NextResponse.json({ message: "Resposta atualizada" }, { status: 200 });
    }

    return NextResponse.json({ message: "Tipo inválido. Use question ou reply." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao editar Q&A:", error);
    return NextResponse.json({ message: "Erro ao editar conteúdo" }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  let verifiedUid: string;
  try {
    verifiedUid = await verifyAuth(req);
  } catch {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const trailId = normalizeText(req.nextUrl.searchParams.get("trailId"));
    const sectionId = normalizeText(req.nextUrl.searchParams.get("sectionId"));
    const questionId = normalizeText(req.nextUrl.searchParams.get("questionId"));
    const replyId = normalizeText(req.nextUrl.searchParams.get("replyId"));
    const type = normalizeText(req.nextUrl.searchParams.get("type"));

    if (!trailId || !sectionId || !questionId || !type) {
      return NextResponse.json(
        { message: "Parâmetros obrigatórios: trailId, sectionId, questionId e type" },
        { status: 400 }
      );
    }

    const user = await getAuthUser(verifiedUid);
    const questionRef = getQuestionRef(trailId, sectionId, questionId);

    if (type === "question") {
      const questionDoc = await questionRef.get();
      if (!questionDoc.exists) {
        return NextResponse.json({ message: "Pergunta não encontrada" }, { status: 404 });
      }
      const data = questionDoc.data() || {};
      const isOwner = data.authorUid === user.uid;
      if (!isOwner && !user.isAdmin) {
        return NextResponse.json({ message: "Sem permissão para excluir esta pergunta" }, { status: 403 });
      }

      const repliesSnap = await questionRef.collection(REPLIES_COLLECTION).get();
      const batch = adminDb.batch();
      repliesSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      batch.delete(questionRef);
      await batch.commit();

      return NextResponse.json({ message: "Pergunta removida" }, { status: 200 });
    }

    if (type === "reply") {
      if (!replyId) {
        return NextResponse.json({ message: "replyId é obrigatório para excluir resposta" }, { status: 400 });
      }
      const replyRef = questionRef.collection(REPLIES_COLLECTION).doc(replyId);
      const replyDoc = await replyRef.get();
      if (!replyDoc.exists) {
        return NextResponse.json({ message: "Resposta não encontrada" }, { status: 404 });
      }

      const data = replyDoc.data() || {};
      const isOwner = data.authorUid === user.uid;
      if (!isOwner && !user.isAdmin) {
        return NextResponse.json({ message: "Sem permissão para excluir esta resposta" }, { status: 403 });
      }

      await replyRef.delete();
      const questionDoc = await questionRef.get();
      const currentCount = Number(questionDoc.data()?.replyCount || 0);
      await questionRef.update({
        replyCount: currentCount > 0 ? currentCount - 1 : 0,
        lastActivityAt: new Date(),
      });

      return NextResponse.json({ message: "Resposta removida" }, { status: 200 });
    }

    return NextResponse.json({ message: "Tipo inválido. Use question ou reply." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao remover Q&A:", error);
    return NextResponse.json({ message: "Erro ao remover conteúdo" }, { status: 500 });
  }
};
