import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";
import { Web3eduBrasilTokens } from "../target/types/web3edu_brasil_tokens";

// Deterministic keypairs — same across devnet runs so the on-chain config stays consistent
function seedKeypair(label: string): Keypair {
  const seed = Buffer.alloc(32);
  Buffer.from(label).copy(seed);
  return Keypair.fromSeed(seed);
}

describe("web3edu-brasil-tokens", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Web3eduBrasilTokens as Program<Web3eduBrasilTokens>;

  const minterKeypair   = seedKeypair("web3edu-minter-devnet-v1");
  const burnerKeypair   = seedKeypair("web3edu-burner-devnet-v1");
  const recipientKeypair = seedKeypair("web3edu-recipient-devnet-v1");
  const mintKeypair     = Keypair.generate(); // fresh per run, tied to a unique trail hash

  // Unique trail hashes per run — avoids "account already in use" on devnet
  const runTs = Date.now();
  const trailHash = Buffer.alloc(32);
  Buffer.from(runTs.toString()).copy(trailHash);

  const anotherTrailHash = Buffer.alloc(32);
  Buffer.from((runTs + 1).toString()).copy(anotherTrailHash);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [trailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), trailHash],
    program.programId
  );

  const [anotherTrailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), anotherTrailHash],
    program.programId
  );

  before(async () => {
    // Fund minter (pays rent for new accounts) and burner (receives rent on close)
    const minterBalance = await provider.connection.getBalance(minterKeypair.publicKey);
    if (minterBalance < 0.05 * anchor.web3.LAMPORTS_PER_SOL) {
      const fundTx = new anchor.web3.Transaction()
        .add(anchor.web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: minterKeypair.publicKey,
          lamports: 0.1 * anchor.web3.LAMPORTS_PER_SOL,
        }))
        .add(anchor.web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: burnerKeypair.publicKey,
          lamports: 0.01 * anchor.web3.LAMPORTS_PER_SOL,
        }));
      await provider.sendAndConfirm(fundTx);
    }

    // Initialize config on first run; update minter/burner to deterministic keys on subsequent runs
    const existing = await provider.connection.getAccountInfo(configPda);
    if (!existing) {
      await program.methods
        .initialize(minterKeypair.publicKey, burnerKeypair.publicKey)
        .accounts({
          config: configPda,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } else {
      await program.methods
        .updateConfig(minterKeypair.publicKey, burnerKeypair.publicKey)
        .accounts({
          config: configPda,
          admin: provider.wallet.publicKey,
        })
        .rpc();
    }
  });

  // ─── Initialize ─────────────────────────────────────────────────────────────

  it("initializes the program with admin, minter, and burner", async () => {
    const config = await program.account.programConfig.fetch(configPda);

    assert.equal(config.admin.toBase58(), provider.wallet.publicKey.toBase58());
    assert.equal(config.minter.toBase58(), minterKeypair.publicKey.toBase58());
    assert.equal(config.burner.toBase58(), burnerKeypair.publicKey.toBase58());
  });

  // ─── Mint Certificate ────────────────────────────────────────────────────────

  it("mints a certificate NFT for a completed trail", async () => {
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientKeypair.publicKey
    );

    await program.methods
      .mintCertificate(Array.from(trailHash), "ipfs://QmExampleHash")
      .accounts({
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintKeypair.publicKey,
        recipientTokenAccount,
        recipient: recipientKeypair.publicKey,
        signer: minterKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([minterKeypair, mintKeypair])
      .rpc();

    const record = await program.account.trailMintRecord.fetch(trailRecordPda);
    assert.deepEqual(Buffer.from(record.trailHash), trailHash);
    assert.equal(record.tokenMint.toBase58(), mintKeypair.publicKey.toBase58());
    assert.equal(record.uri, "ipfs://QmExampleHash");
  });

  // ─── Double Mint Prevention ──────────────────────────────────────────────────

  it("rejects double-minting the same trail", async () => {
    const duplicateMint = Keypair.generate();
    const recipientTokenAccount = await getAssociatedTokenAddress(
      duplicateMint.publicKey,
      recipientKeypair.publicKey
    );

    try {
      await program.methods
        .mintCertificate(Array.from(trailHash), "ipfs://QmExampleHash")
        .accounts({
          config: configPda,
          trailRecord: trailRecordPda,
          mint: duplicateMint.publicKey,
          recipientTokenAccount,
          recipient: recipientKeypair.publicKey,
          signer: minterKeypair.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([minterKeypair, duplicateMint])
        .rpc();

      assert.fail("Expected double-mint to throw");
    } catch (err) {
      assert.ok(err);
    }
  });

  // ─── Unauthorized Mint ───────────────────────────────────────────────────────

  it("rejects mint from an unauthorized signer", async () => {
    const fakeMinter = Keypair.generate();
    const newMint = Keypair.generate();
    const fakeRecipient = Keypair.generate();
    const fakeRecipientTokenAccount = await getAssociatedTokenAddress(
      newMint.publicKey,
      fakeRecipient.publicKey
    );

    const fundTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: fakeMinter.publicKey,
        lamports: 0.05 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(fundTx);

    try {
      await program.methods
        .mintCertificate(Array.from(anotherTrailHash), "ipfs://QmOtherHash")
        .accounts({
          config: configPda,
          trailRecord: anotherTrailRecordPda,
          mint: newMint.publicKey,
          recipientTokenAccount: fakeRecipientTokenAccount,
          recipient: fakeRecipient.publicKey,
          signer: fakeMinter.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([fakeMinter, newMint])
        .rpc();

      assert.fail("Expected unauthorized error");
    } catch (err: any) {
      assert.include(err.message, "Unauthorized");
    }
  });

  // ─── Unauthorized Burn (must run BEFORE authorized burn) ─────────────────────

  it("rejects burn from an unauthorized signer", async () => {
    const fakeBurner = Keypair.generate();
    const holderTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientKeypair.publicKey
    );

    const fundTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: provider.wallet.publicKey,
        toPubkey: fakeBurner.publicKey,
        lamports: 0.01 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(fundTx);

    try {
      await program.methods
        .burnCertificate(Array.from(trailHash))
        .accounts({
          config: configPda,
          trailRecord: trailRecordPda,
          mint: mintKeypair.publicKey,
          holderTokenAccount,
          holder: recipientKeypair.publicKey,
          signer: fakeBurner.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([fakeBurner, recipientKeypair])
        .rpc();

      assert.fail("Expected unauthorized error");
    } catch (err: any) {
      assert.include(err.message, "Unauthorized");
    }
  });

  // ─── Burn Certificate ────────────────────────────────────────────────────────

  it("burns a certificate when called by the burner", async () => {
    const holderTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientKeypair.publicKey
    );

    await program.methods
      .burnCertificate(Array.from(trailHash))
      .accounts({
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintKeypair.publicKey,
        holderTokenAccount,
        holder: recipientKeypair.publicKey,
        signer: burnerKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([burnerKeypair, recipientKeypair])
      .rpc();

    try {
      await program.account.trailMintRecord.fetch(trailRecordPda);
      assert.fail("Account should be closed after burn");
    } catch (err) {
      assert.ok(err);
    }
  });
});
