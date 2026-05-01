export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import fs from "fs";
import { AiAnswerProps } from "@/interfaces/interfaces";

function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]+\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const POST = async (req: NextRequest) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key não configurada" }, { status: 500 });
    }

    const { trailId, question, answer, lessonRange } = await req.json();

    if (!trailId || !question || !answer || !Array.isArray(lessonRange)) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: trailId, question, answer, lessonRange" }, { status: 400 });
    }

    if (answer.length > 800) {
      return NextResponse.json({ error: "Resposta muito longa, máximo 800 caracteres" }, { status: 400 });
    }

    // Lê os arquivos MDX das aulas do intervalo especificado
    const lessonTexts: string[] = [];
    for (const lessonNum of lessonRange) {
      const mdxPath = path.join(process.cwd(), "src", "contents", "trails", trailId, `${lessonNum}.mdx`);
      if (fs.existsSync(mdxPath)) {
        const raw = fs.readFileSync(mdxPath, "utf-8");
        const clean = stripMarkup(raw).slice(0, 2000);
        lessonTexts.push(`=== Aula ${lessonNum} ===\n${clean}`);
      }
    }

    const lessonContext = lessonTexts.join("\n\n").slice(0, 8000);

    const prompt = `Você é um avaliador de respostas abertas em uma plataforma de ensino.
Com base no conteúdo das aulas e na pergunta, classifique a resposta do aluno.

Critérios:
1) Relevância ao conteúdo da aula.
2) Correção conceitual em relação à pergunta.
3) Clareza mínima.
4) Respostas genéricas/off-topic devem ser inválidas.

Contexto das aulas:
${lessonContext || "Sem contexto disponível"}

Pergunta:
${question}

Resposta do aluno:
${answer}

Retorne SOMENTE JSON no formato:
{
  "valido": boolean,
  "explicacao": "texto curto em pt-BR com no máximo 3 frases"
}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const modelResponse = await model.generateContent(prompt);
    const result = modelResponse.response.text();
    const jsonString = result.replace(/```json|```/g, "").trim();

    let parsed: AiAnswerProps;
    try {
      const obj = JSON.parse(jsonString);
      parsed = {
        valido: Boolean(obj?.valido),
        explicacao:
          typeof obj?.explicacao === "string" && obj.explicacao.trim().length > 0
            ? obj.explicacao.trim()
            : "Não foi possível validar sua resposta com segurança.",
      };
    } catch {
      parsed = {
        valido: false,
        explicacao: "Não foi possível interpretar a resposta da IA. Tente reformular sua resposta.",
      };
    }

    return NextResponse.json(parsed, { status: 201 });
  } catch (error: any) {
    console.error("Erro no endpoint AI quiz:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao validar resposta" },
      { status: 500 }
    );
  }
};
