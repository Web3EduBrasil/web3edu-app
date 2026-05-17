import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
  try {
    const trailId = req.nextUrl.searchParams.get("trailId");
    const uid = req.nextUrl.searchParams.get("uid");

    if (!trailId || !uid) {
      return NextResponse.json({ message: "Parâmetros trailId e uid são obrigatórios" }, { status: 400 });
    }

    const contentsSnapshot = await adminDb.collection(`trails/${trailId}/contents`).get();

    const allContents = contentsSnapshot.docs.map((contentDoc) => ({
      id: contentDoc.id,
      done: false,
      title: contentDoc.data().title,
      type: contentDoc.data().type ?? "text",
    }));

    // Lê diretório de MDX disponíveis para esta trilha
    const trailMdxDir = path.join(process.cwd(), "src", "contents", "trails", trailId);
    const availableMdxIds = new Set<string>();
    if (fs.existsSync(trailMdxDir)) {
      fs.readdirSync(trailMdxDir)
        .filter((f) => f.endsWith(".mdx"))
        .forEach((f) => availableMdxIds.add(f.replace(".mdx", "")));
    }

    // Filtra seções do tipo "text" sem arquivo MDX correspondente
    const contents = allContents.filter((section) => {
      if (section.type !== "text") return true;
      return availableMdxIds.has(section.id);
    });

    const userDocSnap = await adminDb.collection("users").doc(uid).get();

    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      const trailEntry = userData?.trails?.find((trail: any) => trail.trailId === trailId);
      const doneSections = trailEntry?.doneSections ?? [];
      contents.forEach((content) => {
        const isDone = doneSections.includes(content.id);
        if (isDone) content.done = true;
      });
    }

    // Seção virtual de conclusão — sempre a última
    const allSectionsDone = contents.length > 0 && contents.every((c) => c.done);
    contents.push({
      id: "99",
      done: allSectionsDone,
      title: "Agradecimento",
      type: "conclusion",
    });

    return NextResponse.json(contents, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ message: "Erro ao buscar dados" }, { status: 500 });
  }
};
