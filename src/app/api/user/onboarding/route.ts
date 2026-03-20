import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const userDocRef = adminDb.collection("users").doc(verifiedUid);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      await userDocRef.update({ tutorialDone: true });

      return NextResponse.json({ message: "Field 'tutorialDone' updated to true." }, { status: 200 });
    } else {
      return NextResponse.json({ message: "User document does not exist." }, { status: 404 });
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({
      message: "Internal Server Error",
      error: error.message,
    }, { status: 500 });
  }
};
