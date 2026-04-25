import { adminDb } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");

    if (!trailId) {
      return NextResponse.json({ message: "Parâmetro trailId é obrigatório" }, { status: 400 });
    }

    const trailDocSnap = await adminDb.collection("trails").doc(trailId).get();

    if (trailDocSnap.exists) {
      const trailData = trailDocSnap.data()!;
      return NextResponse.json(
        {
          trailId,
          banner: trailData.banner,
          categories: trailData.categories,
          createdAt: trailData.createdAt,
          description: trailData.description,
          estimatedTime: trailData.estimatedTime,
          introVideo: trailData.introVideo,
          name: trailData.name,
          topics: trailData.topics,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: "Trilha não encontrada" }, { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ message: "Erro ao buscar dados" }, { status: 500 });
  }
};
