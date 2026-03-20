import { adminDb } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const programId = req.nextUrl.searchParams.get("programId");

    if (!programId) {
      return NextResponse.json({ message: "Parâmetro programId é obrigatório" }, { status: 400 });
    }

    const programDocSnap = await adminDb.collection("programs").doc(programId).get();

    if (programDocSnap.exists) {
      const programData = programDocSnap.data()!;
      return NextResponse.json(
        {
          programId,
          title: programData.title,
          description: programData.description,
          banner: programData.banner,
          estimatedTime: programData.estimatedTime,
          requirements: programData.requirements,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: "Programa não encontrado" }, { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ message: "Erro ao buscar dados" }, { status: 500 });
  }
};
