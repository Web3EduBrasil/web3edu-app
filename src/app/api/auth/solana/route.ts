import { NextRequest, NextResponse } from "next/server";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import { adminAuth } from "@/lib/firebase-admin";

const MAX_AGE_MS = 10 * 60 * 1000;
const MAX_SKEW_MS = 2 * 60 * 1000;

function buildMessage(publicKey: string, timestamp: number): string {
  return `Web3EduBrasil Authentication\n\nEndereço: ${publicKey}\nTimestamp: ${timestamp}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { publicKey, signature, timestamp } = body;
    const normalizedTimestamp =
      typeof timestamp === "string" ? Number(timestamp) : timestamp;

    if (
      typeof publicKey !== "string" ||
      typeof signature !== "string" ||
      !Number.isFinite(normalizedTimestamp)
    ) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const age = Date.now() - normalizedTimestamp;
    if (age < -MAX_SKEW_MS) {
      return NextResponse.json(
        { error: "Relogio do dispositivo adiantado. Ajuste e tente novamente." },
        { status: 400 }
      );
    }
    if (age > MAX_AGE_MS) {
      return NextResponse.json(
        { error: "Mensagem expirada. Tente novamente." },
        { status: 400 }
      );
    }

    const message = buildMessage(publicKey, normalizedTimestamp);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, "base64");
    const pubkeyBytes = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      pubkeyBytes
    );

    if (!isValid) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    // Solana public key (base58) used as the Firebase UID
    const uid = publicKey;

    let customToken: string;
    try {
      customToken = await adminAuth.createCustomToken(uid, {
        wallet: uid,
        loginMethod: "solana",
      });
    } catch (adminError: any) {
      console.error("[Solana auth] Falha ao criar custom token:", adminError?.message);
      return NextResponse.json(
        { error: "Configuração do servidor incompleta." },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: customToken });
  } catch (error: any) {
    console.error("[Solana auth] erro:", error?.message || error);
    return NextResponse.json({ error: "Erro interno na autenticação" }, { status: 500 });
  }
}
