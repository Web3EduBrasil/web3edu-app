export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const ipfsGateway = "https://ipfs.io/ipfs/";

const toGatewayUrl = (value?: string): string => {
  if (!value) return "";
  if (value.startsWith("ipfs://")) {
    return `${ipfsGateway}${value.replace("ipfs://", "")}`;
  }
  if (value.startsWith("http")) return value;
  return `${ipfsGateway}${value}`;
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

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Não foi possível buscar a imagem" }, { status: 404 });
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const pngBuffer = await sharp(imageBuffer).png().toBuffer();

    const pdfDoc = await PDFDocument.create();
    const embeddedImage = await pdfDoc.embedPng(pngBuffer);
    const width = embeddedImage.width;
    const height = embeddedImage.height;

    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, { x: 0, y: 0, width, height });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=certificado.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error?.message || error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
};
