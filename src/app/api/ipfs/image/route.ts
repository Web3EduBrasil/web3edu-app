export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const ipfsGateway = "https://ipfs.io/ipfs/";

const toGatewayUrl = (value?: string): string => {
  if (!value) return "";
  if (value.startsWith("ipfs://")) {
    return `${ipfsGateway}${value.replace("ipfs://", "")}`;
  }
  if (value.startsWith("http")) return value;
  return `${ipfsGateway}${value}`;
};

const detectSvg = (contentType: string, text: string) => {
  if (contentType.includes("image/svg+xml")) return true;
  if (contentType.includes("text") || contentType.includes("xml") || !contentType) {
    return text.trim().startsWith("<svg");
  }
  return false;
};

export const GET = async (req: NextRequest) => {
  try {
    const imageParam = req.nextUrl.searchParams.get("image") || "";
    if (!imageParam) {
      return NextResponse.json({ error: "Parâmetro image é obrigatório" }, { status: 400 });
    }

    const imageUrl = toGatewayUrl(imageParam);
    if (!imageUrl) {
      return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
    }

    const response = await fetch(imageUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Não foi possível buscar a imagem" }, { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const textPreview = buffer.toString("utf8", 0, Math.min(buffer.length, 1024));
    const isSvg = detectSvg(contentType, textPreview);

    const finalContentType = isSvg
      ? "image/svg+xml"
      : contentType.startsWith("image/")
        ? contentType
        : "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": finalContentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar imagem do IPFS:", error?.message || error);
    return NextResponse.json({ error: "Erro ao buscar imagem" }, { status: 500 });
  }
};

import { verifyAuth } from "@/lib/auth-helper";

/**
 * Faz upload de uma imagem externa para o IPFS via Pinata.
 * Recebe { imageUrl: string } e retorna { ipfsUrl: "ipfs://..." }
 */
export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }

  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Campo 'imageUrl' é obrigatório" }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json({ error: "Pinata JWT não configurado" }, { status: 500 });
    }

    // Busca a imagem da URL original
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Não foi possível buscar a imagem" }, { status: 400 });
    }
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const imgBuffer = await imgRes.arrayBuffer();

    // Faz upload para Pinata como arquivo binário
    const formData = new FormData();
    const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([imgBuffer], { type: contentType });
    formData.append("file", blob, `nft-image.${ext}`);

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${pinataJwt}` },
      body: formData,
    });

    if (!pinataRes.ok) {
      const err = await pinataRes.text();
      return NextResponse.json({ error: `Erro Pinata: ${err}` }, { status: pinataRes.status });
    }

    const data = await pinataRes.json();
    return NextResponse.json({ ipfsUrl: `ipfs://${data.IpfsHash}` }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao fazer upload da imagem para IPFS:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
