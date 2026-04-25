import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return new NextResponse(JSON.stringify({ message: "Não autorizado" }), { status: 401 }); }
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
      return new NextResponse(
        JSON.stringify({
          message:
            "Missing required fields: uid, displayName, linkedin, discord",
        }),
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      await userDocRef.update({
        displayName,
        socialMedia,
      });

      return new NextResponse(
        JSON.stringify({ message: "Usuário atualizado com sucesso" }),
        { status: 200 }
      );
    } else {
      await userDocRef.set({
        displayName,
        socialMedia,
      });

      return new NextResponse(
        JSON.stringify({ message: "Usuário adicionado com sucesso" }),
        { status: 201 }
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
