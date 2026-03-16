import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  try {
    const docsRef = collection(db, "programs");
    const querySnapshot = await getDocs(docsRef);

    const programs: any = [];

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

    return new NextResponse(JSON.stringify({ programs }), {
      status: 200,
    });
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse("Erro ao buscar programas", { status: 500 });
  }
};
