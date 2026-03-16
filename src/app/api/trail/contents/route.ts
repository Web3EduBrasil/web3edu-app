import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");
    const uid = req.nextUrl.searchParams.get("uid");

    if (!trailId || !uid) {
      return new NextResponse("Parâmetros trailId e uid são obrigatórios", {
        status: 400,
      });
    }

    const contentsRef = collection(db, `trails/${trailId}/contents`);
    const contentsSnapshot = await getDocs(contentsRef);

    const contents = contentsSnapshot.docs.map((contentDoc) => ({
      id: contentDoc.id,
      done: false,
      title: contentDoc.data().title,
    }));

    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      contents.forEach((content) => {
        const isDone = userData?.trails?.some((trail: any) =>
          trail.doneSections?.includes(content.id)
        );
        if (isDone) {
          content.done = true;
        }
      });
    }

    return new NextResponse(JSON.stringify(contents), {
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return new NextResponse("Erro ao buscar dados", { status: 500 });
  }
};
