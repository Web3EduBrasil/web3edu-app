import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const programId = req.nextUrl.searchParams.get("programId");

    if (!programId) {
      return new NextResponse("Parâmetro programId é obrigatório", {
        status: 400,
      });
    }

    const programDocRef = doc(db, "programs", programId);
    const programDocSnap = await getDoc(programDocRef);

    if (programDocSnap.exists()) {
      const programData = programDocSnap.data();

      return new NextResponse(
        JSON.stringify({
          programId,
          title: programData.title,
          description: programData.description,
          banner: programData.banner,
          estimatedTime: programData.estimatedTime,
          requirements: programData.requirements,
        }),
        {
          status: 200,
        }
      );
    } else {
      return new NextResponse("Programa não encontrado", { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return new NextResponse("Erro ao buscar dados", { status: 500 });
  }
};
