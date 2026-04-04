import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest, res: NextResponse) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const { walletAddress, trailId, ipfsHash } = await req.json();
    const uid = verifiedUid;
    if (!trailId || !walletAddress || !ipfsHash) {
      return NextResponse.json(
        { message: "Parâmetros trailId, walletAddress e ipfsHash são obrigatórios" },
        { status: 400 }
      );
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ message: "walletAddress inválido" }, { status: 400 });
    }
    const whitelistDocRef = adminDb.collection("whitelist").doc(uid);
    const docSnap = await whitelistDocRef.get();

    if (docSnap.exists) {
      await whitelistDocRef.update({
        address: walletAddress,
        [`status.${trailId}`]: {
          eligible: true,
          ipfsHash: ipfsHash,
          minted: false,
          txHash: "",
        },
      });

      return NextResponse.json(
        { message: "Status do usuário atualizado na whitelist com sucesso" },
        { status: 200 }
      );
    } else {
      await whitelistDocRef.set({
        address: walletAddress,
        status: {
          [trailId]: {
            eligible: true,
            ipfsHash: ipfsHash,
            minted: false,
          },
        },
      });

      return NextResponse.json(
        { message: "Usuário adicionado à whitelist com sucesso" },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const trailId = req.nextUrl.searchParams.get("trailId");
    if (!uid || !trailId) {
      return NextResponse.json(
        { error: "Parâmetros uid e trailId são obrigatórios" },
        { status: 400 }
      );
    }

    const whitelistDocRef = adminDb.collection("whitelist").doc(uid);
    const docSnap = await whitelistDocRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ eligible: true }, { status: 200 });
    }

    const userData = docSnap.data();
    const trailStatus = userData?.status?.[trailId];

    if (!trailStatus) {
      return NextResponse.json({ eligible: true }, { status: 200 });
    }

    const alreadyMinted = trailStatus.minted === true;
    const hasTxHash = trailStatus.txHash && trailStatus.txHash !== "";
    const isEligible = !alreadyMinted && !hasTxHash;
    // pending = registrado na whitelist mas CF ainda não mintou
    const isPending = isEligible && !!trailStatus;

    return NextResponse.json(
      { eligible: isEligible, pending: isPending, txHash: trailStatus.txHash || null },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
