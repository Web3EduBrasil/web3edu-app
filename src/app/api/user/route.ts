import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { NextRequest, NextResponse } from "next/server";
import { create } from "domain";

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");

    if (!uid) {
      throw new Error("Missing required parameter: uid");
    }

    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      return new NextResponse(JSON.stringify({ user: userData }), {
        status: 200,
      });
    } else {
      return new NextResponse(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }
  } catch (error: any) {
    console.log(error.message);
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
    console.log(data);
    const userDocRef = doc(db, "users", data.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      return new NextResponse(JSON.stringify({ user: userData }), {
        status: 200,
      });
    } else {
      data = {
        ...data,
        createdAt: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      };
      const user = await setDoc(userDocRef, data);

      return new NextResponse(
        JSON.stringify({
          message: "Usuario adicionado com sucesso",
          user: user,
        }),
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.log(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
