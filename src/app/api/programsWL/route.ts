import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { programId, address, email, name } = await req.json();
    if (!programId || !address || !email || !name) {
      return NextResponse.json(
        { error: "Parameters programId, address, email and name are required" },
        { status: 400 }
      );
    }

    const programDocRef = adminDb.collection("programsWL").doc(programId);
    const docSnap = await programDocRef.get();

    if (docSnap.exists) {
      const users = docSnap.data()?.users;
      const userExists = users?.some((user: any) => user.address === address);

      if (userExists) {
        return NextResponse.json(
          { message: "You already have an open request for this program." },
          { status: 400 }
        );
      }
    }

    await programDocRef.update({
      users: [...(docSnap.data()?.users || []), {
        address,
        email,
        minted: false,
        name,
        txHash: "",
      }],
    });

    return NextResponse.json({ message: "User added to array successfully" }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
