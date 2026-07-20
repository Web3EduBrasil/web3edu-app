/**
 * Script para atualizar o minter do programa Solana na devnet.
 * Roda com: node scripts/update-minter.js
 *
 * Usa o discriminador da instrução update_config diretamente (sem Anchor)
 * para evitar problemas de serialização CJS/ESM.
 */

const { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PROGRAM_ID = new PublicKey("2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ");
const RPC_URL = "https://api.devnet.solana.com";

// Burner existente (mantém o mesmo)
const BURNER_PUBKEY = new PublicKey("FcW1Lx3124QwYjGyNQwW9tUisPZ4ojnQi629aA8Wmw6G");

// Discriminador de update_config (do IDL)
const UPDATE_CONFIG_DISCRIMINATOR = Buffer.from([29, 158, 252, 191, 10, 83, 219, 99]);

async function main() {
  // Carrega o keypair do admin (mesmo que vai virar minter)
  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  if (!fs.existsSync(keypairPath)) {
    throw new Error(`Keypair não encontrado em ${keypairPath}`);
  }

  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  const newMinter = adminKeypair.publicKey;

  console.log("Admin / novo Minter:", newMinter.toBase58());
  console.log("Burner (mantém):", BURNER_PUBKEY.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");

  const balance = await connection.getBalance(adminKeypair.publicKey);
  console.log(`Saldo SOL: ${balance / 1e9} SOL`);
  if (balance < 5000) {
    console.error("Saldo insuficiente. Execute: solana airdrop 1 --url devnet");
    process.exit(1);
  }

  // Deriva o PDA config
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  console.log("Config PDA:", configPDA.toBase58());

  // Serializa os args: minter (32 bytes) + burner (32 bytes) em formato Borsh (pubkeys são bytes diretos)
  const argsBuffer = Buffer.concat([newMinter.toBuffer(), BURNER_PUBKEY.toBuffer()]);
  const data = Buffer.concat([UPDATE_CONFIG_DISCRIMINATOR, argsBuffer]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPDA, isSigner: false, isWritable: true },
      { pubkey: adminKeypair.publicKey, isSigner: true, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
  const tx = new Transaction({
    feePayer: adminKeypair.publicKey,
    recentBlockhash: blockhash,
  });
  tx.add(ix);
  tx.sign(adminKeypair);

  console.log("\nEnviando update_config...");

  try {
    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

    console.log("\n✅ Minter atualizado com sucesso!");
    console.log("Transação:", sig);
    console.log("Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");

    console.log("\n--- PRÓXIMO PASSO ---");
    console.log("Adicione ao arquivo .env.local na raiz do projeto:");
    console.log(`\nMINTER_SECRET_KEY='${JSON.stringify(Array.from(secretKey))}'`);
  } catch (err) {
    if (err.logs) {
      console.error("Logs:", err.logs);
    }
    throw err;
  }
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
