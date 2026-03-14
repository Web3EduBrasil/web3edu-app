import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");

    if (!uid) {
      return new NextResponse("UID do usuário é obrigatório", { status: 400 });
    }

    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return new NextResponse("Usuário não encontrado", { status: 404 });
    }

    const userTrails = userDocSnap.data()?.trails || [];

    const docsRef = collection(db, "trails");
    const querySnapshot = await getDocs(docsRef);

    const trails: any = [];

    querySnapshot.forEach((trail) => {
      const userTrail = userTrails.find(
        (userTrail: any) => userTrail.trailId === trail.id
      );
      const percentage = userTrail?.percentage || 0;

      trails.push({
        id: trail.id,
        banner: trail.data().banner,
        categories: trail.data().categories,
        estimatedTime: trail.data().estimatedTime,
        name: trail.data().name,
        resumedDescription: trail.data().resumedDescription,
        percentage: percentage,
      });
    });

    return new NextResponse(JSON.stringify({ trails }), {
      status: 200,
    });
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse("Erro ao buscar trilhas", { status: 500 });
  }
};
