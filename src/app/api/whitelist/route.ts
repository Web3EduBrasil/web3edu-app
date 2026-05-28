import { adminDb } from "@/lib/firebase-admin";
import { computeTrailProgress } from "@/lib/trail-progress";
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

const readTrailMinted = async (trailId: string): Promise<boolean | null> => {
  if (!rpcUrl || !contractAddress) return null;
  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const trailHash = keccak256(stringToHex(trailId));
    const minted = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: contractAbi,
      functionName: "hasTrailMinted",
      args: [trailHash],
    });
    return minted as boolean;
  } catch (error) {
    console.error("Erro ao checar mint on-chain:", error);
    return null;
  }
};

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
