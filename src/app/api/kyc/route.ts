import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const data = await req.json();
    const userDocRef = adminDb.collection("users").doc(verifiedUid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      await userDocRef.update({
        kyc: {
          level: data.userInfo.level,
          interests: data.userInfo.interests,
        },
      });
      return NextResponse.json({ message: "Dados de KYC atualizados com sucesso" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
