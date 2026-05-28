import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createBaseStudentProfile, upsertStudentProfile } from "@/lib/student-profile";
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { message: "Parâmetro uid é obrigatório" },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      const userData = docSnap.data();
      return NextResponse.json({ user: userData }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Usuário não encontrado" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { message: "Erro ao buscar documento" },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    let data = await req.json();
    if (!data?.uid) {
      return NextResponse.json(
        { message: "Parâmetro uid é obrigatório" },
        { status: 400 }
      );
    }

    const baseProfile = createBaseStudentProfile({
      uid: data.uid,
      email: data.email ?? null,
      emailVerified: data.emailVerified ?? false,
      displayName: data.displayName ?? "",
      certificateName: data.certificateName ?? data.displayName ?? "",
      photoURL: data.photoURL ?? null,
      walletAddress: data.walletAddress ?? null,
      walletProvider: data.walletProvider ?? null,
      preferredLanguage: data.preferredLanguage ?? "pt",
      timezone: data.timezone ?? null,
    });

    const profilePayload = {
      ...baseProfile,
      xp: data.xp ?? 0,
      level: data.level ?? 1,
      streak: data.streak ?? 0,
      lastActiveAt: data.lastActiveAt ?? new Date().toISOString().split("T")[0],
      tutorialDone: data.tutorialDone ?? false,
    };

    await upsertStudentProfile(data.uid, profilePayload);
    return NextResponse.json(
      {
        message: "Usuario criado/atualizado com sucesso",
        user: profilePayload,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "WALLET_ALREADY_LINKED") {
      return NextResponse.json(
        { message: "Carteira ja vinculada a outro usuario" },
        { status: 409 }
      );
    }
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
