import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";
import { Connection, PublicKey } from "@solana/web3.js";
import { mintTrailCertificate, getMintErrorCode } from "@/lib/solana-mint";

export const maxDuration = 60;

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ"
);

const connection = new Connection(
  process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.devnet.solana.com",
  "confirmed"
);

const readProgramMinted = async (programId: string): Promise<boolean | null> => {
  try {
    const trailHash = Buffer.alloc(32);
    Buffer.from(programId).copy(trailHash);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trail"), trailHash],
      PROGRAM_ID
    );
    const account = await connection.getAccountInfo(pda);
    return account !== null;
  } catch (error) {
    console.error("Erro ao checar mint on-chain:", error);
    return null;
  }
};

function isValidSolanaPubkey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/programWhitelist?uid=&programId=
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

    const onChainMinted = programId ? await readProgramMinted(programId) : null;
    if (onChainMinted) {
      return NextResponse.json(
        {
          eligible: false,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: "ALREADY_MINTED",
          errorMessage: "Certificado já foi resgatado para este programa",
          ipfsHash: null,
        },
        { status: 200 }
      );
    }

    const docRef = adminDb.collection("programWhitelist").doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        {
          eligible: true,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: null,
          errorMessage: null,
          ipfsHash: null,
        },
        { status: 200 }
      );
    }

    const userData = docSnap.data();
    const programStatus = userData?.status?.[programId];

    if (!programStatus) {
      return NextResponse.json(
        {
          eligible: true,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: null,
          errorMessage: null,
          ipfsHash: null,
        },
        { status: 200 }
      );
    }

    const isMarkedEligible = programStatus.eligible === true;
    const alreadyMinted = programStatus.minted === true;
    const hasTxHash = typeof programStatus.txHash === "string" && programStatus.txHash !== "";
    const hasTerminalError = programStatus.terminalError === true;
    const isEligible = isMarkedEligible && !alreadyMinted && !hasTxHash && !hasTerminalError;
    const isPending = isEligible && !!programStatus;

    return NextResponse.json(
      {
        eligible: isEligible,
        pending: isPending,
        txHash: programStatus.txHash || null,
        terminalError: hasTerminalError,
        errorCode: programStatus.errorCode || null,
        errorMessage: programStatus.errorMessage || null,
        ipfsHash: programStatus.ipfsHash || null,
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

/**
 * POST /api/programWhitelist
 */
export const POST = async (req: NextRequest) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return NextResponse.json({ message: "Não autorizado" }, { status: 401 }); }
  try {
    const { walletAddress, programId, ipfsHash } = await req.json();

    const uid = verifiedUid;

    if (!walletAddress || !programId || !ipfsHash) {
      return NextResponse.json(
        { error: "Parâmetros walletAddress, programId e ipfsHash são obrigatórios" },
        { status: 400 }
      );
    }
    if (!isValidSolanaPubkey(walletAddress)) {
      return NextResponse.json({ message: "walletAddress inválido" }, { status: 400 });
    }

    const onChainMinted = await readProgramMinted(programId);
    if (onChainMinted) {
      return NextResponse.json(
        { message: "Certificado já foi resgatado para este programa" },
        { status: 409 }
      );
    }

    const docRef = adminDb.collection("programWhitelist").doc(uid);
    const docSnap = await docRef.get();
    const isUpdate = docSnap.exists;

    const pendingState = {
      eligible: true,
      ipfsHash,
      minted: false,
      txHash: "",
      terminalError: false,
      errorCode: null,
      errorMessage: null,
      errorAt: null,
    };

    if (isUpdate) {
      await docRef.update({ address: walletAddress, [`status.${programId}`]: pendingState });
    } else {
      await docRef.set({ address: walletAddress, status: { [programId]: pendingState } });
    }

    try {
      const txSignature = await mintTrailCertificate(walletAddress, programId, ipfsHash);

      await docRef.update({ [`status.${programId}.txHash`]: txSignature });

      return NextResponse.json(
        {
          message: isUpdate
            ? "Certificado mintado e whitelist de programa atualizada com sucesso"
            : "Certificado mintado e usuário adicionado à whitelist de programas",
          txHash: txSignature,
        },
        { status: isUpdate ? 200 : 201 }
      );
    } catch (mintError: unknown) {
      const { errorCode, errorMessage } = getMintErrorCode(mintError);

      await docRef.update({
        [`status.${programId}.terminalError`]: true,
        [`status.${programId}.errorCode`]: errorCode,
        [`status.${programId}.errorMessage`]: errorMessage,
        [`status.${programId}.errorAt`]: new Date().toISOString(),
      });

      console.error("Erro ao mintar certificado Solana (programa):", mintError);
      return NextResponse.json({ message: errorMessage, errorCode }, { status: 422 });
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
