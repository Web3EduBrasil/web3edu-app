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
        { error: "Parâmetros trailId, walletAddress e ipfsHash são obrigatórios" },
        { status: 400 }
      );
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
          terminalError: false,
          errorCode: null,
          errorMessage: null,
          errorAt: null,
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
            txHash: "",
            terminalError: false,
            errorCode: null,
            errorMessage: null,
            errorAt: null,
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
      return NextResponse.json(
        {
          eligible: true,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: null,
          errorMessage: null,
        },
        { status: 200 }
      );
    }

    const userData = docSnap.data();
    const trailStatus = userData?.status?.[trailId];

    if (!trailStatus) {
      return NextResponse.json(
        {
          eligible: true,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: null,
          errorMessage: null,
        },
        { status: 200 }
      );
    }

    const isMarkedEligible = trailStatus.eligible === true;
    const alreadyMinted = trailStatus.minted === true;
    const hasTxHash = typeof trailStatus.txHash === "string" && trailStatus.txHash !== "";
    const hasTerminalError = trailStatus.terminalError === true;
    const isEligible = isMarkedEligible && !alreadyMinted && !hasTxHash && !hasTerminalError;
    // pending = registrado na whitelist, sem txHash e sem erro terminal
    const isPending = isEligible && !!trailStatus;

    return NextResponse.json(
      {
        eligible: isEligible,
        pending: isPending,
        txHash: trailStatus.txHash || null,
        terminalError: hasTerminalError,
        errorCode: trailStatus.errorCode || null,
        errorMessage: trailStatus.errorMessage || null,
      },
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
