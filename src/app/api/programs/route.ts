import { adminDb } from "@/lib/firebase-admin";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const querySnapshot = await adminDb.collection("programs").get();

    const programs: any[] = [];
    querySnapshot.forEach((program) => {
      programs.push({
        id: program.id,
        title: program.data().title,
        description: program.data().description,
        resumedDescription: program.data().resumedDescription,
        estimatedTime: program.data().estimatedTime,
        banner: program.data().banner,
      });
    });

    return NextResponse.json({ programs }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Erro ao buscar programas" }, { status: 500 });
  }
};
