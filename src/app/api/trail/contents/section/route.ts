import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
