import { adminDb } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");
    const uid = req.nextUrl.searchParams.get("uid");

    if (!trailId || !uid) {
      return NextResponse.json({ message: "Parâmetros trailId e uid são obrigatórios" }, { status: 400 });
    }

    const contentsSnapshot = await adminDb.collection(`trails/${trailId}/contents`).get();

    const contents = contentsSnapshot.docs.map((contentDoc) => ({
      id: contentDoc.id,
      done: false,
      title: contentDoc.data().title,
    }));

    const userDocSnap = await adminDb.collection("users").doc(uid).get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      contents.forEach((content) => {
        const isDone = userData?.trails?.some((trail: any) =>
          trail.doneSections?.includes(content.id)
        );
        if (isDone) content.done = true;
      });
    }

    return NextResponse.json(contents, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ message: "Erro ao buscar dados" }, { status: 500 });
  }
};
