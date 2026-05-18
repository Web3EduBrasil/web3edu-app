import { adminDb } from "@/lib/firebase-admin";
import { computeTrailProgress } from "@/lib/trail-progress";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ message: "UID do usuário é obrigatório" }, { status: 400 });
    }

    const userDocSnap = await adminDb.collection("users").doc(uid).get();

    if (!userDocSnap.exists) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const userTrails = userDocSnap.data()?.trails || [];

    const querySnapshot = await adminDb.collection("trails").get();

    const trails = await Promise.all(
      querySnapshot.docs.map(async (trail) => {
        const userTrail = userTrails.find(
          (userTrail: any) => userTrail.trailId === trail.id
        );
        const doneSections = userTrail?.doneSections ?? [];
        const { percentage } = await computeTrailProgress(trail.id, doneSections);

        return {
          id: trail.id,
          banner: trail.data().banner,
          categories: trail.data().categories,
          estimatedTime: trail.data().estimatedTime,
          name: trail.data().name,
          resumedDescription: trail.data().resumedDescription,
          percentage,
        };
      })
    );

    return NextResponse.json({ trails }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Erro ao buscar trilhas", error: error.message }, { status: 500 });
  }
};

