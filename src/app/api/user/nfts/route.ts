import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x8984b78F102f85222E7fa9c43d37d84E087B1Be8";

    const nfts: any[] = [];

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
          nfts.push({
            walletAddress: data.address,
            trailId,
            ipfs: s.ipfsHash
              ? (s.ipfsHash.startsWith("ipfs://")
                ? `https://gateway.pinata.cloud/ipfs/${s.ipfsHash.replace("ipfs://", "")}`
                : `https://gateway.pinata.cloud/ipfs/${s.ipfsHash}`)
              : "",
            createdAt: new Date().toISOString(),
            openseaUrl: `https://testnets.opensea.io/assets/sepolia/${contractAddress}`,
          });
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
          nfts.push({
            walletAddress: data.address,
            trailId: programId,
            ipfs: s.ipfsHash
              ? (s.ipfsHash.startsWith("ipfs://")
                ? `https://gateway.pinata.cloud/ipfs/${s.ipfsHash.replace("ipfs://", "")}`
                : `https://gateway.pinata.cloud/ipfs/${s.ipfsHash}`)
              : "",
            createdAt: new Date().toISOString(),
            openseaUrl: `https://testnets.opensea.io/assets/sepolia/${contractAddress}`,
          });
        }
      }
    }

    return NextResponse.json({ nfts }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao buscar NFTs do usuário:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
