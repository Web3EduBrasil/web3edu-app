import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const email = req.nextUrl.searchParams.get("email");
    const googleName = req.nextUrl.searchParams.get("googleName");

    if (!uid) {
      throw new Error("Missing required parameter: uid");
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      const userData = docSnap.data();
      return new NextResponse(JSON.stringify({ user: userData }), {
        status: 200,
      });
    } else {
      const body = {
        uid: uid,
        email: email,
        displayName: googleName,
        tutorialDone: false,
      };
      const postResponse = await POST(
        new NextRequest(req.url, {
          method: "POST",
          body: JSON.stringify(body),
        }),
        new NextResponse()
      );
      return postResponse;
    }
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Erro ao buscar documento" }),
      {
        status: 500,
      }
    );
  }
};

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    let data = await req.json();
    const userDocRef = adminDb.collection("users").doc(data.uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      return new NextResponse(
        JSON.stringify({ message: "Usuário já existe" }),
        { status: 400 }
      );
    } else {
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
      return new NextResponse(
        JSON.stringify({
          message: "Usuario adicionado com sucesso",
          user: data,
        }),
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
