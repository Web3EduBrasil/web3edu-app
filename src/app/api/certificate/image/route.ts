export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const clamp = (text: string, max: number) =>
  text.length > max ? text.slice(0, max - 1) + "…" : text;

function buildCertificateSvg(recipientName: string, trailName: string): string {
  const name = escapeXml(clamp(recipientName, 36));
  const trail = escapeXml(clamp(trailName, 40));
  const nameFontSize = name.length > 24 ? 38 : 52;
  const trailFontSize = trail.length > 28 ? 26 : 32;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#eab308" stroke-width="1.5" rx="16"/>
  <rect x="32" y="32" width="1136" height="566" fill="none" stroke="#eab308" stroke-width="0.4" rx="14" opacity="0.4"/>
  <text x="600" y="108" font-family="Georgia, serif" font-size="22" fill="#eab308" text-anchor="middle" letter-spacing="6" font-weight="bold">WEB3EDU BRASIL</text>
  <text x="600" y="160" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle" letter-spacing="4">CERTIFICADO DE CONCLUSÃO</text>
  <line x1="440" y1="186" x2="760" y2="186" stroke="#eab308" stroke-width="0.8" opacity="0.5"/>
  <text x="600" y="248" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">Certificamos que</text>
  <text x="600" y="330" font-family="Georgia, serif" font-size="${nameFontSize}" fill="#f1f5f9" text-anchor="middle" font-weight="bold">${name}</text>
  <text x="600" y="388" font-family="Arial, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">concluiu com êxito a trilha</text>
  <text x="600" y="448" font-family="Georgia, serif" font-size="${trailFontSize}" fill="#eab308" text-anchor="middle" font-weight="bold">${trail}</text>
  <line x1="440" y1="484" x2="760" y2="484" stroke="#eab308" stroke-width="0.8" opacity="0.5"/>
  <text x="600" y="528" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle" letter-spacing="2">TOKEN NFT · REDE SOLANA</text>
  <circle cx="596" cy="572" r="3" fill="#eab308" opacity="0.5"/>
  <circle cx="600" cy="572" r="3" fill="#eab308"/>
  <circle cx="604" cy="572" r="3" fill="#eab308" opacity="0.5"/>
</svg>`;
}

export const POST = async (req: NextRequest) => {
  try { await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }

  try {
    const { recipientName, trailName } = await req.json();
    if (!recipientName || !trailName) {
      return NextResponse.json(
        { error: "recipientName e trailName são obrigatórios" },
        { status: 400 }
      );
    }

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json({ error: "Pinata JWT não configurado" }, { status: 500 });
    }

    const svg = buildCertificateSvg(recipientName, trailName);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const formData = new FormData();
    formData.append("file", blob, "certificate.svg");

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
    console.error("Erro ao gerar imagem do certificado:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
