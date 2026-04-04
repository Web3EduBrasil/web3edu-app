import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const { displayName, socialMedia } = await req.json();
    const uid = verifiedUid;

    if (
      !uid ||
      !displayName ||
      !socialMedia ||
      socialMedia.linkedin === undefined ||
      socialMedia.discord === undefined
    ) {
      return NextResponse.json(
        { message: "Missing required fields: uid, displayName, linkedin, discord" },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      await userDocRef.update({ displayName, socialMedia });
      return NextResponse.json({ message: "Usuário atualizado com sucesso" }, { status: 200 });
    } else {
      await userDocRef.set({ displayName, socialMedia });
      return NextResponse.json({ message: "Usuário adicionado com sucesso" }, { status: 201 });
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
