import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

/**
 * GET /api/programWhitelist?uid=&programId=
 * Verifica se o usuário pode resgatar o certificado de um programa.
 */
export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const programId = req.nextUrl.searchParams.get("programId");

    if (!uid || !programId) {
      return NextResponse.json(
        { error: "Parâmetros uid e programId são obrigatórios" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("programWhitelist").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ eligible: true }, { status: 200 });
    }

    const userData = docSnap.data();
    const programStatus = userData?.status?.[programId];

    if (!programStatus) {
      return NextResponse.json({ eligible: true }, { status: 200 });
    }

    const alreadyMinted = programStatus.minted === true;
    const hasTxHash = programStatus.txHash && programStatus.txHash !== "";
    const isEligible = !alreadyMinted && !hasTxHash;
    const isPending = isEligible && !!programStatus;

    return NextResponse.json(
      { eligible: isEligible, pending: isPending, txHash: programStatus.txHash || null },
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

/**
 * POST /api/programWhitelist
 * Registra o usuário na whitelist de um programa para receber o NFT de certificado.
 */
export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const { walletAddress, programId, ipfsHash } = await req.json();
    if (walletAddress && !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json({ message: "walletAddress inválido" }, { status: 400 });
    }
    const uid = verifiedUid;

    if (!uid || !walletAddress || !programId || !ipfsHash) {
      return NextResponse.json(
        { error: "Parâmetros uid, walletAddress, programId e ipfsHash são obrigatórios" },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("programWhitelist").doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      await docRef.update({
        address: walletAddress,
        [`status.${programId}`]: {
          eligible: true,
          ipfsHash: ipfsHash,
          minted: false,
          txHash: "",
        },
      });
      return NextResponse.json(
        { message: "Status do programa atualizado na whitelist com sucesso" },
        { status: 200 }
      );
    } else {
      await docRef.set({
        address: walletAddress,
        status: {
          [programId]: {
            eligible: true,
            ipfsHash: ipfsHash,
            minted: false,
            txHash: "",
          },
        },
      });
      return NextResponse.json(
        { message: "Usuário adicionado à whitelist de programas com sucesso" },
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
