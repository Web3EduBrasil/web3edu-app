import { onDocumentWritten, FirestoreEvent, DocumentSnapshot, Change } from "firebase-functions/v2/firestore";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  updateAirdropStatus,
  updateAirdropTerminalFailureStatus,
  TerminalErrorCode,
} from "../utils/firestoreScripts";
import { getSolanaProgram, buildTrailHash, PROGRAM_ID } from "../utils/solanaWallet";

function classifyTerminalError(error: unknown): { errorCode: TerminalErrorCode; errorMessage: string } {
  const err = error as { message?: string; shortMessage?: string };

  const rawMessage =
    err?.shortMessage ||
    err?.message ||
    "Unknown mint error";

  const sanitizedMessage = rawMessage.replace(/\s+/g, " ").trim().slice(0, 300);
  const normalized = sanitizedMessage.toLowerCase();

  if (/(unauthorized|permission|not authorized)/i.test(normalized)) {
    return { errorCode: "ACCESS_CONTROL", errorMessage: sanitizedMessage };
  }
  if (/(invalid.*address|pubkey)/i.test(normalized)) {
    return { errorCode: "INVALID_ADDRESS", errorMessage: sanitizedMessage };
  }
  if (/(rpc|network|timeout|timed out|429|rate limit|connection)/i.test(normalized)) {
    return { errorCode: "RPC_ERROR", errorMessage: sanitizedMessage };
  }

  return { errorCode: "UNKNOWN", errorMessage: sanitizedMessage || "Unknown mint error" };
}

export const airdropNFT = onDocumentWritten(
  {
    document: "whitelist/{uid}",
    secrets: ["SOLANA_MINTER_PRIVATE_KEY", "SOLANA_RPC_URL"],
  },
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { uid: string }>) => {
    if (!event.data) {
      console.error("Event data is undefined");
      return;
    }

    const newValue = event.data.after.data();
    const uid = event.params.uid;
    const airdropCategories = newValue?.status ?? {};

    const minterPrivKeyJson = process.env.SOLANA_MINTER_PRIVATE_KEY;
    const rpcUrl = process.env.SOLANA_RPC_URL;

    if (!minterPrivKeyJson || !rpcUrl) {
      const errorMessage = "Missing required Solana secrets for minting";
      console.error(errorMessage);
      for (const category in airdropCategories) {
        const airdrop = airdropCategories[category];
        if (airdrop?.eligible && !airdrop?.minted && !airdrop?.terminalError) {
          await updateAirdropTerminalFailureStatus(uid, category, "UNKNOWN", errorMessage);
        }
      }
      return;
    }

    const minterPrivKeyBytes: number[] = JSON.parse(minterPrivKeyJson);
    const { program, minterKeypair } = getSolanaProgram(minterPrivKeyBytes, rpcUrl);

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );

    for (const category in airdropCategories) {
      const airdrop = airdropCategories[category];

      if (airdrop.eligible && !airdrop.minted && !airdrop.terminalError) {
        try {
          const recipientAddress = newValue?.address;
          const ipfsHash = airdrop.ipfsHash;
          const tokenURI = ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`;

          const trailHash = buildTrailHash(category);

          const [trailRecordPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("trail"), trailHash],
            PROGRAM_ID
          );

          const mintKeypair = Keypair.generate();
          const recipientPubkey = new PublicKey(recipientAddress);

          const recipientTokenAccount = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            recipientPubkey
          );

          const txSignature = await program.methods
            .mintCertificate(Array.from(trailHash), tokenURI)
            .accounts({
              config: configPda,
              trailRecord: trailRecordPda,
              mint: mintKeypair.publicKey,
              recipientTokenAccount,
              recipient: recipientPubkey,
              signer: minterKeypair.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([minterKeypair, mintKeypair])
            .rpc();

          await updateAirdropStatus(uid, category, true, txSignature);

          console.log(`Airdrop bem-sucedido para usuário ${uid} na categoria ${category} - Tx: ${txSignature}`);
        } catch (error) {
          console.error(`Erro no airdrop para usuário ${uid} na categoria ${category}:`, error);
          const { errorCode, errorMessage } = classifyTerminalError(error);
          await updateAirdropTerminalFailureStatus(uid, category, errorCode, errorMessage);
        }
      }
    }
  }
);
