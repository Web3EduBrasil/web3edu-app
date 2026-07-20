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

  const connection = new Connection(
    process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.devnet.solana.com",
    "confirmed"
  );

  const provider = new AnchorProvider(connection, makeNodeWallet(minterKeypair), {
    commitment: "confirmed",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider);

  const trailHash = Buffer.alloc(32);
  Buffer.from(trailId).copy(trailHash);

  const mintKeypair = Keypair.generate();
  const recipient = new PublicKey(walletAddress);
  const uri = ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`;

  // Constrói a transação sem assinar (PDAs e contas de programa são auto-resolvidas pelo Anchor)
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

  if (msg.includes("TrailAlreadyMinted") || msg.includes("6001")) {
    return {
      errorCode: "TRAIL_ALREADY_MINTED",
      errorMessage: "Esta trilha já foi mintada na blockchain",
    };
  }
  if (msg.includes("Unauthorized") || msg.includes("6000")) {
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
  if (msg.includes("insufficient funds") || msg.includes("0x1")) {
    return {
      errorCode: "INSUFFICIENT_FUNDS",
      errorMessage: "Saldo SOL insuficiente na carteira do minter para pagar as taxas",
    };
  }

  return { errorCode: "MINT_FAILED", errorMessage: msg.slice(0, 300) };
}
