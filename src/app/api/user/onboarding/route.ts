import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest, res: NextResponse) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return new NextResponse(JSON.stringify({ message: "Não autorizado" }), { status: 401 }); }
  try {
    const userDocRef = doc(db, "users", verifiedUid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      await updateDoc(userDocRef, { tutorialDone: true });

      return new NextResponse(
        JSON.stringify({ message: "Field 'tutorialDone' updated to true." }),
        { status: 200 }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ message: "User document does not exist." }),
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
