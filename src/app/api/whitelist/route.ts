import { adminDb } from "@/lib/firebase-admin";
import { computeTrailProgress } from "@/lib/trail-progress";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";
import { Connection, PublicKey } from "@solana/web3.js";
import { mintTrailCertificate, getMintErrorCode } from "@/lib/solana-mint";

// Aumenta o timeout no Vercel Pro/Enterprise para acomodar a submissão da tx
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

const readTrailMinted = async (trailId: string): Promise<boolean | null> => {
  try {
    const trailHash = Buffer.alloc(32);
    Buffer.from(trailId).copy(trailHash);
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
    if (!isValidSolanaPubkey(walletAddress)) {
      return NextResponse.json({ message: "walletAddress inválido" }, { status: 400 });
    }

    const userDocSnap = await adminDb.collection("users").doc(uid).get();
    if (!userDocSnap.exists) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const userTrails = userDocSnap.data()?.trails || [];
    const trailEntry = userTrails.find((trail: any) => trail.trailId === trailId);
    const doneSections = trailEntry?.doneSections || [];
    const { percentage } = await computeTrailProgress(trailId, doneSections);
    if (percentage < 100) {
      return NextResponse.json(
        { message: "Complete 100% da trilha para resgatar o certificado." },
        { status: 403 }
      );
    }
    const onChainMinted = await readTrailMinted(trailId);
    if (onChainMinted) {
      return NextResponse.json(
        { message: "Certificado já foi resgatado para esta trilha" },
        { status: 409 }
      );
    }

    const whitelistDocRef = adminDb.collection("whitelist").doc(uid);
    const docSnap = await whitelistDocRef.get();
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

    // Grava estado pendente antes de tentar o mint
    if (isUpdate) {
      await whitelistDocRef.update({ address: walletAddress, [`status.${trailId}`]: pendingState });
    } else {
      await whitelistDocRef.set({ address: walletAddress, status: { [trailId]: pendingState } });
    }

    // Executa o mint na rede Solana
    try {
      const txSignature = await mintTrailCertificate(walletAddress, trailId, ipfsHash);

      // Salva o txHash no Firestore assim que a tx é submetida (antes de aguardar confirmação)
      await whitelistDocRef.update({ [`status.${trailId}.txHash`]: txSignature });

      return NextResponse.json(
        {
          message: isUpdate
            ? "Certificado mintado e whitelist atualizada com sucesso"
            : "Certificado mintado e usuário adicionado à whitelist",
          txHash: txSignature,
        },
        { status: isUpdate ? 200 : 201 }
      );
    } catch (mintError: unknown) {
      const { errorCode, errorMessage } = getMintErrorCode(mintError);

      await whitelistDocRef.update({
        [`status.${trailId}.terminalError`]: true,
        [`status.${trailId}.errorCode`]: errorCode,
        [`status.${trailId}.errorMessage`]: errorMessage,
        [`status.${trailId}.errorAt`]: new Date().toISOString(),
      });

      console.error("Erro ao mintar certificado Solana:", mintError);
      return NextResponse.json({ message: errorMessage, errorCode }, { status: 422 });
    }
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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

    const onChainMinted = trailId ? await readTrailMinted(trailId) : null;
    if (onChainMinted) {
      return NextResponse.json(
        {
          eligible: false,
          pending: false,
          txHash: null,
          terminalError: false,
          errorCode: "ALREADY_MINTED",
          errorMessage: "Certificado já foi resgatado para esta trilha",
          ipfsHash: null,
        },
        { status: 200 }
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
          ipfsHash: null,
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
          ipfsHash: null,
        },
        { status: 200 }
      );
    }

    const isMarkedEligible = trailStatus.eligible === true;
    const alreadyMinted = trailStatus.minted === true;
    const hasTxHash = typeof trailStatus.txHash === "string" && trailStatus.txHash !== "";
    const hasTerminalError = trailStatus.terminalError === true;
    const isEligible = isMarkedEligible && !alreadyMinted && !hasTxHash && !hasTerminalError;
    const isPending = isEligible && !!trailStatus;

    return NextResponse.json(
      {
        eligible: isEligible,
        pending: isPending,
        txHash: trailStatus.txHash || null,
        terminalError: hasTerminalError,
        errorCode: trailStatus.errorCode || null,
        errorMessage: trailStatus.errorMessage || null,
        ipfsHash: trailStatus.ipfsHash || null,
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
