import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

/**
 * POST /z/trail
 * Inscreve o usuário em uma trilha (adiciona à lista trails sem doneSections).
 * Idempotente — não duplica se já estiver inscrito.
 */
export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try {
    verifiedUid = await verifyAuth(req);
  } catch {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const { trailId } = await req.json();

    if (!trailId) {
      return NextResponse.json(
        { message: "Parâmetro trailId é obrigatório" },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(verifiedUid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const trails: any[] = userSnap.data()?.trails || [];
    const alreadyEnrolled = trails.some((t: any) => t.trailId === trailId);

    if (alreadyEnrolled) {
      return NextResponse.json({ enrolled: true, alreadyEnrolled: true }, { status: 200 });
    }

    await userDocRef.update({
      trails: [...trails, { trailId, doneSections: [], percentage: 0 }],
    });

    return NextResponse.json({ enrolled: true }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao inscrever em trilha:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
};

/**
 * GET /api/user/trail?uid=&trailId=
 * Verifica se o usuário está inscrito em uma trilha.
 */
export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const trailId = req.nextUrl.searchParams.get("trailId");

    if (!uid || !trailId) {
      return NextResponse.json(
        { message: "Parâmetros uid e trailId são obrigatórios" },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ enrolled: false }, { status: 200 });
    }

    const trails: any[] = userSnap.data()?.trails || [];
    const trailEntry = trails.find((t: any) => t.trailId === trailId);

    return NextResponse.json(
      {
        enrolled: !!trailEntry,
        percentage: trailEntry?.percentage || 0,
        doneSections: trailEntry?.doneSections || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao verificar inscrição:", error);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
};
