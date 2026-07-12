import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "@/idl/web3edu_brasil_tokens.json";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ"
);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(idl as any, provider);
}
