import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
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

    const userDocRef = adminDb.collection("users").doc(data.uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      return NextResponse.json(
        { message: "Usuário já existe", user: docSnap.data() },
        { status: 200 }
      );
    }

    data = {
      ...data,
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveAt: new Date().toISOString().split("T")[0],
      createdAt: new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
    };
    await userDocRef.set(data);
    return NextResponse.json(
      {
        message: "Usuario adicionado com sucesso",
        user: data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
