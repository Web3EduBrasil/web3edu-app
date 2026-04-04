import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";
import { adminDb } from "@/lib/firebase-admin";

const todayStr = (): string => new Date().toISOString().split("T")[0];

const yesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};

export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try {
    verifiedUid = await verifyAuth(req);
  } catch {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const uid = verifiedUid;
    if (!uid) {
      return NextResponse.json({ message: "uid obrigatório" }, { status: 400 });
    }

    const userDocRef = adminDb.collection("users").doc(uid);
    const snap = await userDocRef.get();
    if (!snap.exists) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const data = snap.data() as any;
    const today = todayStr();
    const yesterday = yesterdayStr();
    const lastActive: string = data.lastActiveAt || "";
    let streak: number = data.streak || 0;

    if (lastActive === today) {
      // Já registrado hoje — sem alteração
      return NextResponse.json({ streak }, { status: 200 });
    }

    if (lastActive === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }

    await userDocRef.update({ streak, lastActiveAt: today });
    return NextResponse.json({ streak }, { status: 200 });
  } catch (error: any) {
    console.error("streak error:", error.message || error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
