import { createHash } from "crypto";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import IDL from "@/idl/web3edu_brasil_tokens.json";

function getMinterKeypair(): Keypair {
  const raw = process.env.MINTER_SECRET_KEY;
  if (!raw) throw new Error("MINTER_SECRET_KEY não configurado");
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  } catch {
    throw new Error("MINTER_SECRET_KEY inválido — deve ser um array JSON de bytes");
  }
}

function makeNodeWallet(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      if (tx instanceof VersionedTransaction) {
        tx.sign([keypair]);
      } else {
        tx.partialSign(keypair);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      return txs.map((tx) => {
        if (tx instanceof VersionedTransaction) {
          tx.sign([keypair]);
        } else {
          tx.partialSign(keypair);
        }
        return tx;
      });
    },
  };
}

function makeConnection(): Connection {
  return new Connection(
    process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.devnet.solana.com",
    "confirmed"
  );
}

function trailHashFor(trailId: string, walletAddress: string): Buffer {
  return Buffer.from(createHash("sha256").update(`${trailId}|${walletAddress}`).digest());
}

/**
 * If the trail_record PDA already exists on-chain, looks up and returns the
 * original mint transaction signature. Returns null if the PDA does not exist.
 */
export async function recoverMintSignature(
  walletAddress: string,
  trailId: string
): Promise<string | null> {
  const connection = makeConnection();
  const trailHash = trailHashFor(trailId, walletAddress);
  const [trailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), trailHash],
    new PublicKey(IDL.address)
  );
  const existing = await connection.getAccountInfo(trailRecordPda);
  if (existing === null) return null;
  const sigs = await connection.getSignaturesForAddress(trailRecordPda, { limit: 1 });
  return sigs.length > 0 ? sigs[0].signature : null;
}

/**
 * Executa o mint do certificado NFT na rede Solana usando o Anchor program.
 * Retorna a assinatura da transação imediatamente após a submissão (antes da confirmação),
 * para que possa ser salva no Firestore e devolvida ao cliente sem bloquear.
 */
export async function mintTrailCertificate(
  walletAddress: string,
  trailId: string,
  ipfsHash: string
): Promise<string> {
  const minterKeypair = getMinterKeypair();
  const connection = makeConnection();

  const provider = new AnchorProvider(connection, makeNodeWallet(minterKeypair), {
    commitment: "confirmed",
  });

  const program = new Program(IDL as any, provider);

  const trailHash = trailHashFor(trailId, walletAddress);

  // If the trail_record PDA already exists, a previous mint succeeded on-chain
  // but the txHash was never saved to Firestore. Recover it instead of re-minting.
  const [trailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), trailHash],
    new PublicKey(IDL.address)
  );
  const existingRecord = await connection.getAccountInfo(trailRecordPda);
  if (existingRecord !== null) {
    const sigs = await connection.getSignaturesForAddress(trailRecordPda, { limit: 1 });
    if (sigs.length > 0) return sigs[0].signature;
    throw new Error("TrailAlreadyMinted");
  }

  const mintKeypair = Keypair.generate();
  const recipient = new PublicKey(walletAddress);
  const uri = ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`;

  const tx = await (program.methods as any)
    .mintCertificate(Array.from(trailHash), uri)
    .accounts({
      mint: mintKeypair.publicKey,
      recipient,
      signer: minterKeypair.publicKey,
    })
    .transaction();

  const { blockhash } = await connection.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.feePayer = minterKeypair.publicKey;
  tx.sign(minterKeypair, mintKeypair);

  // Submete sem aguardar confirmação — o txHash já é suficiente para o cliente
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  return signature;
}

export function getMintErrorCode(error: unknown): { errorCode: string; errorMessage: string } {
  const msg = String(error instanceof Error ? error.message : error);
  // @solana/web3.js SendTransactionError stores simulation details in .logs, not .message
  const logs: string[] = Array.isArray((error as any)?.logs) ? (error as any).logs : [];
  const combined = msg + " " + logs.join(" ");

  if (combined.includes("TrailAlreadyMinted") || combined.includes("6001")) {
    return {
      errorCode: "TRAIL_ALREADY_MINTED",
      errorMessage: "Você já resgatou o certificado desta trilha",
    };
  }
  if (combined.includes("custom program error: 0x0") || combined.includes("AccountAlreadyInUse")) {
    return {
      errorCode: "TRAIL_ALREADY_MINTED",
      errorMessage: "Você já resgatou o certificado desta trilha",
    };
  }
  if (combined.includes("Unauthorized") || combined.includes("6000")) {
    return {
      errorCode: "UNAUTHORIZED_MINTER",
      errorMessage: "Chave do minter não tem autoridade no programa Solana",
    };
  }
  if (msg.includes("MINTER_SECRET_KEY")) {
    return {
      errorCode: "MINTER_NOT_CONFIGURED",
      errorMessage: "Chave do minter não configurada no servidor (MINTER_SECRET_KEY)",
    };
  }
  if (combined.includes("insufficient funds") || combined.includes("0x1")) {
    return {
      errorCode: "INSUFFICIENT_FUNDS",
      errorMessage: "Saldo SOL insuficiente na carteira do minter para pagar as taxas",
    };
  }

  return { errorCode: "MINT_FAILED", errorMessage: msg.slice(0, 300) };
}
