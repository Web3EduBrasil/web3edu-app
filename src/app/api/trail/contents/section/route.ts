import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// Mapeamento: sectionId → arquivo quiz JSON
const QUIZ_MAP: Record<string, string> = {
  "3.5":  "quiz1.json",
  "6.5":  "quiz2.json",
  "9.5":  "quiz3.json",
  "13.5": "quiz4.json",
};

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");
    const sectionId = req.nextUrl.searchParams.get("sectionId");
    const uid = req.nextUrl.searchParams.get("uid");

    if (!trailId || !sectionId || !uid) {
      return NextResponse.json(
        { message: "Parâmetros trailId, sectionId e uid são obrigatórios" },
        { status: 400 }
      );
    }

    // Se for um quiz, lê o arquivo JSON local
    const quizFileName = QUIZ_MAP[sectionId];
    if (quizFileName) {
      const quizPath = path.join(process.cwd(), "src", "contents", "trails", trailId, "quiz", quizFileName);
      if (!fs.existsSync(quizPath)) {
        return NextResponse.json({ message: "Quiz não encontrado" }, { status: 404 });
      }
      const quizData = JSON.parse(fs.readFileSync(quizPath, "utf-8"));

      // Verifica se o usuário já completou este quiz
      let done = false;
      const userDocRef = adminDb.collection("users").doc(uid);
      const userDocSnap = await userDocRef.get();
      if (userDocSnap.exists) {
        const userData = userDocSnap.data();
        const trail = userData?.trails?.find((t: any) => t.trailId === trailId);
        if (trail?.doneSections?.includes(sectionId)) done = true;
      }

      return NextResponse.json({ ...quizData, done, isLast: false }, { status: 200 });
    }

    const contentRef = adminDb.collection(`trails/${trailId}/contents`).doc(sectionId);
    const contentSnapshot = await contentRef.get();

    if (!contentSnapshot.exists) {
      return NextResponse.json({ message: "Conteúdo não encontrado" }, { status: 404 });
    }

    const content: Record<string, any> = {
      id: contentSnapshot.id,
      done: false,
      isLast: false,
      ...contentSnapshot.data(),
    };

    const userDocRef = adminDb.collection("users").doc(uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const trail = userData?.trails?.find((t: any) => t.trailId === trailId);
      if (trail?.doneSections?.includes(sectionId)) {
        content.done = true;
      }
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ message: "Erro ao buscar dados" }, { status: 500 });
  }
};
