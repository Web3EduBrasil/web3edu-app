import { NextRequest, NextResponse } from "next/server";

/**
 * Faz upload de metadata JSON para o IPFS via Pinata.
 * Usa PINATA_JWT (server-side, nunca exposto no browser).
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: "Campo 'content' é obrigatório" }),
        { status: 400 }
      );
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return new NextResponse(
        JSON.stringify({ error: "Pinata JWT não configurado no servidor" }),
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinataContent: content }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return new NextResponse(
        JSON.stringify({ error: `Erro Pinata: ${error}` }),
        { status: response.status }
      );
    }

    const data = await response.json();
    return new NextResponse(
      JSON.stringify({ IpfsHash: data.IpfsHash }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao fazer upload para IPFS:", error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
