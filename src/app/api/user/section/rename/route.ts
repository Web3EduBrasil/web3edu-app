import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { trailId } = await req.json();

    if (!trailId) {
      return new NextResponse("Parâmetro trailId é obrigatório", {
        status: 400,
      });
    }

    const contentsCollectionRef = adminDb.collection(`trails/${trailId}/contents`);

    // Obter todos os documentos de "contents"
    const contentsSnap = await contentsCollectionRef.get();

    if (contentsSnap.empty) {
      return new NextResponse("Nenhum documento encontrado em contents", {
        status: 404,
      });
    }

    let count = 1; // Inicializa o contador para os novos nomes

    for (const contentDoc of contentsSnap.docs) {
      const contentData = contentDoc.data(); // Obtem os dados do documento

      // Define o novo ID baseado no contador
      const newDocId = count.toString();

      // Cria o novo documento com o novo ID
      const newDocRef = contentsCollectionRef.doc(newDocId);
      await newDocRef.set(contentData);

      // Opcional: Apagar o documento antigo após a criação do novo
      await contentDoc.ref.delete();

      count++; // Incrementa o contador
    }

    return new NextResponse(
      JSON.stringify({ message: "Documentos renomeados com sucesso" }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
