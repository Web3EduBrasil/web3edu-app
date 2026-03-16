import { doc, getDoc } from "firebase/firestore";
export const dynamic = "force-dynamic";
import { db } from "@/firebase/config";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");

    if (!trailId) {
      return new NextResponse("Parâmetro trailId é obrigatório", {
        status: 400,
      });
    }

    const trailDocRef = doc(db, "trails", trailId);
    const trailDocSnap = await getDoc(trailDocRef);

    if (trailDocSnap.exists()) {
      const trailData = trailDocSnap.data();

      return new NextResponse(
        JSON.stringify({
          trailId,
          banner: trailData.banner,
          categories: trailData.categories,
          createdAt: trailData.createdAt,
          description: trailData.description,
          estimatedTime: trailData.estimatedTime,
          introVideo: trailData.introVideo,
          name: trailData.name,
          topics: trailData.topics,
        }),
        {
          status: 200,
        }
      );
    } else {
      return new NextResponse("Trilha não encontrada", { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return new NextResponse("Erro ao buscar dados", { status: 500 });
  }
};
