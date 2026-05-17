import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const pinataGateway = "https://ipfs.io/ipfs/";

const normalizeIpfsHash = (hash?: string): string => {
  if (!hash) return "";
  return hash.startsWith("ipfs://") ? hash.replace("ipfs://", "") : hash;
};

const toGatewayUrl = (value?: string): string => {
  if (!value) return "";
  if (value.startsWith("ipfs://")) {
    return `${pinataGateway}${value.replace("ipfs://", "")}`;
  }
  if (value.startsWith("http")) return value;
  return `${pinataGateway}${value}`;
};

const fetchMetadata = async (ipfsHash: string) => {
  if (!ipfsHash) return null;
  try {
    const response = await fetch(toGatewayUrl(ipfsHash), { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar metadata do IPFS:", error);
    return null;
  }
};

/**
 * GET /api/user/nfts?walletAddress=0x...
 * Retorna os NFTs mintados do usuário a partir dos dados do Firestore (whitelist + programWhitelist).
 * Fallback para quando a Alchemy NFT API não está disponível.
 */
export const GET = async (req: NextRequest) => {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Parâmetro walletAddress é obrigatório" },
        { status: 400 }
      );
    }

    const nftPromises: Promise<any>[] = [];

    // Busca whitelist (trilhas) onde address == walletAddress
    const whitelistSnap = await adminDb
      .collection("whitelist")
      .where("address", "==", walletAddress.toLowerCase())
      .get();

    // Também tenta com o endereço original (case-sensitive)
    const whitelistSnapOriginal = walletAddress !== walletAddress.toLowerCase()
      ? await adminDb
        .collection("whitelist")
        .where("address", "==", walletAddress)
        .get()
      : { docs: [] };

    const allWhitelistDocs = [...whitelistSnap.docs, ...whitelistSnapOriginal.docs];
    const seenUids = new Set<string>();

    for (const doc of allWhitelistDocs) {
      if (seenUids.has(doc.id)) continue;
      seenUids.add(doc.id);

      const data = doc.data();
      const status = data.status || {};
      for (const [trailId, trailStatus] of Object.entries(status)) {
        const s = trailStatus as any;
        if (s.minted && s.txHash) {
          const ipfsHash = normalizeIpfsHash(s.ipfsHash);
          nftPromises.push((async () => {
            const metadata = await fetchMetadata(ipfsHash);
            const imageUrl = toGatewayUrl(metadata?.image);
            return {
              walletAddress: data.address,
              trailId,
              type: "trail",
              ipfsHash,
              imageUrl,
              certificateUrl: ipfsHash ? `/certificates/${ipfsHash}` : "",
              createdAt: new Date().toISOString(),
            };
          })());
        }
      }
    }

    // Busca programWhitelist (programas) onde address == walletAddress
    const programSnap = await adminDb
      .collection("programWhitelist")
      .where("address", "==", walletAddress.toLowerCase())
      .get();

    const programSnapOriginal = walletAddress !== walletAddress.toLowerCase()
      ? await adminDb
        .collection("programWhitelist")
        .where("address", "==", walletAddress)
        .get()
      : { docs: [] };

    const allProgramDocs = [...programSnap.docs, ...programSnapOriginal.docs];
    const seenProgramUids = new Set<string>();

    for (const doc of allProgramDocs) {
      if (seenProgramUids.has(doc.id)) continue;
      seenProgramUids.add(doc.id);

      const data = doc.data();
      const status = data.status || {};
      for (const [programId, programStatus] of Object.entries(status)) {
        const s = programStatus as any;
        if (s.minted && s.txHash) {
          const ipfsHash = normalizeIpfsHash(s.ipfsHash);
          nftPromises.push((async () => {
            const metadata = await fetchMetadata(ipfsHash);
            const imageUrl = toGatewayUrl(metadata?.image);
            return {
              walletAddress: data.address,
              trailId: programId,
              type: "program",
              ipfsHash,
              imageUrl,
              certificateUrl: ipfsHash ? `/certificates/${ipfsHash}` : "",
              createdAt: new Date().toISOString(),
            };
          })());
        }
      }
    }

    const nfts = (await Promise.all(nftPromises)).filter(Boolean);
    return NextResponse.json({ nfts }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao buscar NFTs do usuário:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
