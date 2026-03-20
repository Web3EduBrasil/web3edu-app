import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { adminAuth } from "@/lib/firebase-admin";

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos

function buildMessage(address: string, timestamp: number): string {
  return `Web3EduBrasil Authentication\n\nEndereço: ${address}\nTimestamp: ${timestamp}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signature, timestamp } = body;

    if (
      typeof address !== "string" ||
      typeof signature !== "string" ||
      typeof timestamp !== "number"
    ) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Valida frescor do timestamp para prevenir replay attacks
    const age = Date.now() - timestamp;
    if (age < 0 || age > MAX_AGE_MS) {
      return NextResponse.json(
        { error: "Mensagem expirada. Tente novamente." },
        { status: 400 }
      );
    }

    const message = buildMessage(address, timestamp);

    // Verifica a assinatura criptograficamente
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 401 }
      );
    }

    // UID = endereço em lowercase — único e determinístico por carteira
    const uid = address.toLowerCase();

    let customToken: string;
    try {
      customToken = await adminAuth.createCustomToken(uid, {
        wallet: uid,
        loginMethod: "metamask",
      });
    } catch (adminError: any) {
      console.error("[MetaMask auth] Falha ao criar custom token. Verifique se ADMIN_SERVICE_ACCOUNT está configurado no .env:", adminError?.message);
      return NextResponse.json(
        { error: "Configuração do servidor incompleta. Configure ADMIN_SERVICE_ACCOUNT no .env e reinicie o servidor." },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: customToken });
  } catch (error: any) {
    console.error("[MetaMask auth] erro:", error?.message || error);
    return NextResponse.json(
      { error: "Erro interno na autenticação" },
      { status: 500 }
    );
  }
}
