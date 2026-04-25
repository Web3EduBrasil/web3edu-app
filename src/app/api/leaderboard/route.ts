export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const snap = await adminDb.collection("users").orderBy("xp", "desc").limit(10).get();

    const top = snap.docs.map((d) => ({
      uid: d.id,
      displayName: d.data().displayName || "Anônimo",
      xp: d.data().xp || 0,
      level: d.data().level || 1,
      photoURL: d.data().photoURL || null,
    }));

    return NextResponse.json({ top }, { status: 200 });
  } catch (error: any) {
    console.error("leaderboard error:", error.message);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
};
