import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import idl from "./web3edu_brasil_tokens.json";

export const PROGRAM_ID = new PublicKey(
  process.env.SOLANA_PROGRAM_ID || "2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ"
);

export function buildTrailHash(id: string): Buffer {
  const hash = Buffer.alloc(32);
  Buffer.from(id).copy(hash);
  return hash;
}

export function getSolanaProgram(minterPrivKeyBytes: number[], rpcUrl: string) {
  const connection = new Connection(rpcUrl, "confirmed");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(minterPrivKeyBytes));
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return { program: new Program(idl as any, provider), minterKeypair: keypair, connection };
}

export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, SystemProgram, PublicKey, Keypair };
