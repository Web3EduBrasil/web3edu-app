import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("xp", "desc"), limit(10));
    const snap = await getDocs(q);

    const top = snap.docs.map((d) => ({
      uid: d.id,
      displayName: d.data().displayName || "Anônimo",
      xp: d.data().xp || 0,
      level: d.data().level || 1,
      photoURL: d.data().photoURL || null,
    }));

    return new NextResponse(JSON.stringify({ top }), { status: 200 });
  } catch (error: any) {
    console.error("leaderboard error:", error.message);
    return new NextResponse(JSON.stringify({ message: "Erro interno" }), {
      status: 500,
    });
  }
};
