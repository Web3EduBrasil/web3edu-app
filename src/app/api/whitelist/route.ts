import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-helper";

export const POST = async (req: NextRequest, res: NextResponse) => {
  let verifiedUid: string;
  try { verifiedUid = await verifyAuth(req); }
  catch { return new NextResponse(JSON.stringify({ message: "Não autorizado" }), { status: 401 }); }
  try {
    const { walletAddress, trailId, ipfsHash } = await req.json();
    const uid = verifiedUid;
    if (!trailId || !walletAddress || !ipfsHash) {
      return new NextResponse(
        JSON.stringify({
          error: "Parâmetros trailId, walletAddress e ipfsHash são obrigatórios",
        }),
        { status: 400 }
      );
    }
    const whitelistDocRef = adminDb.collection("whitelist").doc(uid);
    const docSnap = await whitelistDocRef.get();

    if (docSnap.exists) {
      // Se o documento já existe, atualiza o status da trilha
      await whitelistDocRef.update({
        address: walletAddress,
        [`status.${trailId}`]: {
          eligible: true,
          ipfsHash: ipfsHash,
          minted: false,
          txHash: "",
        },
      });

      return new NextResponse(
        JSON.stringify({
          message: "Status do usuário atualizado na whitelist com sucesso",
        }),
        { status: 200 }
      );
    } else {
      // Cria o novo documento na coleção "whitelist"
      await whitelistDocRef.set({
        address: walletAddress,
        status: {
          // Cria o objeto status com a trilha como chave
          [trailId]: {
            eligible: true,
            ipfsHash: ipfsHash,
            minted: false,
          },
        },
      });

      return new NextResponse(
        JSON.stringify({
          message: "Usuário adicionado à whitelist com sucesso",
        }),
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const uid = req.nextUrl.searchParams.get("uid");
    const trailId = req.nextUrl.searchParams.get("trailId");
    if (!uid || !trailId) {
      return new NextResponse(
        JSON.stringify({
          error: "Parâmetros uid e trailId são obrigatórios",
        }),
        { status: 400 }
      );
    }

    const whitelistDocRef = adminDb.collection("whitelist").doc(uid);
    const docSnap = await whitelistDocRef.get();

    if (!docSnap.exists) {
      return new NextResponse(
        JSON.stringify({
          eligible: true,
        }),
        { status: 200 }
      );
    }

    const userData = docSnap.data();
    const trailStatus = userData?.status?.[trailId];

    if (!trailStatus) {
      // Trilha nunca foi solicitada — usuário é elegível
      return new NextResponse(
        JSON.stringify({
          eligible: true,
        }),
        { status: 200 }
      );
    }

    // Elegível somente se ainda não foi mintado E não tem txHash (não processado ainda)
    const alreadyMinted = trailStatus.minted === true;
    const hasTxHash = trailStatus.txHash && trailStatus.txHash !== "";
    const isEligible = !alreadyMinted && !hasTxHash;

    return new NextResponse(
      JSON.stringify({
        eligible: isEligible,
        txHash: trailStatus.txHash || null,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error.message);
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 }
    );
  }
};
