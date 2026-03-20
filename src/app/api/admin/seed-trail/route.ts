import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

const TRAIL_ID = "IntroducaoWeb3";

const TRAIL_META = {
  name: "Introdução à Web3",
  resumedDescription: "Fundamentos de Web3, Blockchain e NFTs para iniciantes",
  description:
    "Aprenda os fundamentos da Web3, blockchain, NFTs e criptomoedas de forma prática e acessível. Explore as gerações da internet, como funciona a tecnologia blockchain, suas aplicações reais e como se proteger no mundo cripto.",
  estimatedTime: 3,
  banner:
    "https://firebasestorage.googleapis.com/v0/b/web3edubrasil.firebasestorage.app/o/imagens%2Fintrodu%C3%A7%C3%A3o%20%C3%A0%20Web3.png?alt=media&token=420a423a-fe0d-472a-bd1c-2b9f17fadb31",
  categories: ["blockchain", "web3", "nft", "iniciante"],
  topics: ["Web3", "Blockchain", "Criptomoedas", "NFTs", "Segurança"],
  introVideo: "",
  createdAt: "2025-01-01",
};

/**
 * Seções da trilha IntroducaoWeb3.
 * Chave = ID do documento (deve corresponder ao nome do arquivo .mdx em
 * src/contents/trails/IntroducaoWeb3/).
 * Tipos suportados: "text" (mdx) | "video" | "audio" | "image" | "quiz" | "question"
 *
 * Campos opcionais por tipo:
 *   text    → (nenhum extra — o .mdx é lido do sistema de arquivos)
 *   video   → videoUrl, description
 *   audio   → audioUrl, description
 *   image   → imageUrl, caption, description
 *   quiz    → question, options: [{text, correct}]
 *   question→ title (a pergunta), description (enunciado)
 */
const SECTIONS: Record<string, Record<string, unknown>> = {
  "1": {
    title: "Introdução",
    type: "text",
    order: 1,
  },
  "2": {
    title: "As Gerações da Internet",
    type: "text",
    order: 2,
  },
  "4": {
    title: "Web 2.0, a internet social",
    type: "text",
    order: 3,
  },
  "5": {
    title: "Web3, a internet semântica",
    type: "text",
    order: 4,
  },
  "10": {
    title: "O que é Blockchain?",
    type: "text",
    order: 5,
  },
  "16": {
    title: "Como funciona uma Blockchain?",
    type: "text",
    order: 6,
  },
  "17": {
    title: "Aplicações da Blockchain",
    type: "text",
    order: 7,
  },
  "23": {
    title: "Segurança e Carteiras",
    type: "text",
    order: 8,
  },
  "24": {
    title: "Golpes com Criptomoedas",
    type: "text",
    order: 9,
  },
  "30": {
    title: "O que são NFTs?",
    type: "text",
    order: 10,
  },
  "31": {
    title: "Comunidades NFT",
    type: "text",
    order: 11,
  },
};

/**
 * POST /api/admin/seed-trail
 * Body: { secret: string, force?: boolean }
 *
 * Popula o Firestore com a trilha IntroducaoWeb3 e suas seções.
 * - Por padrão usa merge: true para não sobrescrever dados existentes.
 * - Passe force: true para sobrescrever tudo.
 * - Protegido pela variável de ambiente SEED_SECRET.
 */
export const POST = async (req: NextRequest) => {
  try {
    const { secret, force = false } = await req.json();

    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      return new NextResponse(
        JSON.stringify({ message: "Não autorizado" }),
        { status: 401 }
      );
    }

    const trailRef = adminDb.collection("trails").doc(TRAIL_ID);

    // Cria / atualiza o documento da trilha
    await trailRef.set(TRAIL_META, { merge: !force });

    // Cria / atualiza cada seção
    const results: string[] = [];
    for (const [sectionId, sectionData] of Object.entries(SECTIONS)) {
      const sectionRef = adminDb.collection(`trails/${TRAIL_ID}/contents`).doc(sectionId);
      await sectionRef.set(
        { ...sectionData, trailName: TRAIL_META.name },
        { merge: !force }
      );
      results.push(sectionId);
    }

    return new NextResponse(
      JSON.stringify({
        message: `Trilha "${TRAIL_META.name}" populada com sucesso`,
        trailId: TRAIL_ID,
        seções: results,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return new NextResponse(
      JSON.stringify({ message: error.message || "Erro interno" }),
      { status: 500 }
    );
  }
};

/**
 * GET /api/admin/seed-trail?secret=XXX
 * Retorna o status atual da trilha no Firestore (quantas seções existem).
 */
export const GET = async (req: NextRequest) => {
  try {
    const secret = req.nextUrl.searchParams.get("secret");
    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      return new NextResponse(
        JSON.stringify({ message: "Não autorizado" }),
        { status: 401 }
      );
    }

    const trailRef = adminDb.collection("trails").doc(TRAIL_ID);
    const trailSnap = await trailRef.get();

    return new NextResponse(
      JSON.stringify({
        exists: trailSnap.exists,
        data: trailSnap.exists ? trailSnap.data() : null,
        expectedSections: Object.keys(SECTIONS).length,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Seed GET error:", error);
    return new NextResponse(
      JSON.stringify({ message: error.message }),
      { status: 500 }
    );
  }
};
