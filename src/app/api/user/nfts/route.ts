import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];

const normalizeIpfsHash = (hash?: string): string => {
  if (!hash) return "";
  return hash.startsWith("ipfs://") ? hash.replace("ipfs://", "") : hash;
};

const toGatewayUrl = (value: string, gateway: string): string => {
  if (value.startsWith("ipfs://")) return `${gateway}${value.replace("ipfs://", "")}`;
  if (value.startsWith("http")) return value;
  return `${gateway}${value}`;
};

const fetchMetadata = async (ipfsHash: string) => {
  if (!ipfsHash) return null;
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(toGatewayUrl(ipfsHash, gateway), {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      continue;
    }
  }
  return null;
};

const extractImageValue = (metadata: any): string => {
  if (!metadata) return "";
  const candidates = [metadata.image, metadata.image_url, metadata.imageUrl, metadata.image_data];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

const resolveDisplayImageUrl = (imageValue?: string) => {
  if (!imageValue) return "";
  if (imageValue.startsWith("data:")) return imageValue;
  return `/api/ipfs/image?image=${encodeURIComponent(imageValue)}`;
};

const buildNftFromStatus = async (
  status: Record<string, any>,
  type: "trail" | "program",
  storedAddress: string
) => {
  const promises: Promise<any>[] = [];
  for (const [itemId, s] of Object.entries(status)) {
    const hasTxHash = typeof (s as any).txHash === "string" && (s as any).txHash.trim().length > 0;
    const hasIpfsHash = typeof (s as any).ipfsHash === "string" && (s as any).ipfsHash.trim().length > 0;
    const isTerminalError = (s as any).terminalError === true;
    if (!hasTxHash && (!hasIpfsHash || isTerminalError)) continue;
    const ipfsHash = normalizeIpfsHash((s as any).ipfsHash);
    promises.push(
      (async () => {
        const metadata = await fetchMetadata(ipfsHash);
        const imageValue = extractImageValue(metadata);
        return {
          walletAddress: storedAddress,
          trailId: itemId,
          type,
          ipfsHash,
          imageUrl: resolveDisplayImageUrl(imageValue),
          certificateUrl: ipfsHash ? `/certificates/${ipfsHash}` : "",
          certificateName: metadata?.name ?? "",
          createdAt: new Date().toISOString(),
        };
      })()
    );
  }
  return Promise.all(promises);
};

/**
 * GET /api/user/nfts?uid=<firebaseUid>
 * Busca NFTs pelo UID do usuário (direto nos documentos whitelist/{uid} e programWhitelist/{uid}).
 * Fallback: aceita walletAddress para compatibilidade.
 */
export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");

    if (!uid && !walletAddress) {
      return NextResponse.json(
        { error: "Parâmetro uid ou walletAddress é obrigatório" },
        { status: 400 }
      );
    }

    let allNfts: any[] = [];

    if (uid) {
      // Busca direta por UID — O(1), não requer índice
      const [whitelistSnap, programSnap] = await Promise.all([
        adminDb.collection("whitelist").doc(uid).get(),
        adminDb.collection("programWhitelist").doc(uid).get(),
      ]);

      const whitelistData = whitelistSnap.exists ? whitelistSnap.data()! : null;
      const programData = programSnap.exists ? programSnap.data()! : null;

      const [trailNfts, programNfts] = await Promise.all([
        whitelistData
          ? buildNftFromStatus(whitelistData.status || {}, "trail", whitelistData.address || "")
          : Promise.resolve([]),
        programData
          ? buildNftFromStatus(programData.status || {}, "program", programData.address || "")
          : Promise.resolve([]),
      ]);

      allNfts = [...trailNfts, ...programNfts];
    } else if (walletAddress) {
      // Fallback legacy: busca por endereço (query)
      const [wlSnap, wlSnapOrig, pgSnap, pgSnapOrig] = await Promise.all([
        adminDb.collection("whitelist").where("address", "==", walletAddress.toLowerCase()).get(),
        walletAddress !== walletAddress.toLowerCase()
          ? adminDb.collection("whitelist").where("address", "==", walletAddress).get()
          : Promise.resolve({ docs: [] as any[] }),
        adminDb.collection("programWhitelist").where("address", "==", walletAddress.toLowerCase()).get(),
        walletAddress !== walletAddress.toLowerCase()
          ? adminDb.collection("programWhitelist").where("address", "==", walletAddress).get()
          : Promise.resolve({ docs: [] as any[] }),
      ]);

      const seenTrail = new Set<string>();
      const seenProgram = new Set<string>();
      const promises: Promise<any[]>[] = [];

      for (const doc of [...wlSnap.docs, ...wlSnapOrig.docs]) {
        if (seenTrail.has(doc.id)) continue;
        seenTrail.add(doc.id);
        const d = doc.data();
        promises.push(buildNftFromStatus(d.status || {}, "trail", d.address || ""));
      }
      for (const doc of [...pgSnap.docs, ...pgSnapOrig.docs]) {
        if (seenProgram.has(doc.id)) continue;
        seenProgram.add(doc.id);
        const d = doc.data();
        promises.push(buildNftFromStatus(d.status || {}, "program", d.address || ""));
      }

      const results = await Promise.all(promises);
      allNfts = results.flat();
    }

    const nfts = allNfts.flat().filter(Boolean);
    return NextResponse.json({ nfts }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao buscar NFTs do usuário:", error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};
