import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";
import { createPublicClient, http, keccak256, stringToHex } from "viem";

const contractAddress =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x8984b78F102f85222E7fa9c43d37d84E087B1Be8";

const rpcUrl =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
  process.env.ALCHEMY_RPC_TARGET ||
  process.env.RPC_URL ||
  "";

const contractAbi = [
  {
    inputs: [{ internalType: "bytes32", name: "trailHash", type: "bytes32" }],
    name: "hasTrailMinted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const readProgramMinted = async (programId: string): Promise<boolean | null> => {
  if (!rpcUrl || !contractAddress) return null;
  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const programHash = keccak256(stringToHex(programId));
    const minted = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: "hasTrailMinted",
      args: [programHash],
    });
    return minted as boolean;
  } catch (error) {
    console.error("Erro ao checar mint on-chain:", error);
    return null;
  }
};

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

    const onChainMinted = await readProgramMinted(programId);
    if (onChainMinted) {
      return NextResponse.json(
        { message: "Certificado já foi resgatado para este programa" },
        { status: 409 }
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
          terminalError: false,
          errorCode: null,
          errorMessage: null,
          errorAt: null,
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
            terminalError: false,
            errorCode: null,
            errorMessage: null,
            errorAt: null,
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
