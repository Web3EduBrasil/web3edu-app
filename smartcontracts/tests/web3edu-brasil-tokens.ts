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

describe("web3edu-brasil-tokens", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Web3eduBrasilTokens as Program<Web3eduBrasilTokens>;

  const minterKeypair = Keypair.generate();
  const burnerKeypair = Keypair.generate();
  const recipientKeypair = Keypair.generate();
  const mintKeypair = Keypair.generate();

  const trailHash = Buffer.alloc(32);
  Buffer.from("trail-id-001").copy(trailHash);

  const anotherTrailHash = Buffer.alloc(32);
  Buffer.from("trail-id-002").copy(anotherTrailHash);

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
    const [sigMinter, sigBurner] = await Promise.all([
      provider.connection.requestAirdrop(minterKeypair.publicKey, 2e9),
      provider.connection.requestAirdrop(burnerKeypair.publicKey, 2e9),
    ]);
    await provider.connection.confirmTransaction(sigMinter);
    await provider.connection.confirmTransaction(sigBurner);
  });

  // ─── Initialize ─────────────────────────────────────────────────────────────

  it("initializes the program with admin, minter, and burner", async () => {
    await program.methods
      .initialize(minterKeypair.publicKey, burnerKeypair.publicKey)
      .accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

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

    try {
      await program.methods
        .mintCertificate(Array.from(trailHash), "ipfs://QmExampleHash")
        .accounts({
          config: configPda,
          trailRecord: trailRecordPda,
          mint: duplicateMint.publicKey,
          signer: minterKeypair.publicKey,
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

    const sig = await provider.connection.requestAirdrop(fakeMinter.publicKey, 2e9);
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .mintCertificate(Array.from(anotherTrailHash), "ipfs://QmOtherHash")
        .accounts({
          config: configPda,
          trailRecord: anotherTrailRecordPda,
          mint: newMint.publicKey,
          signer: fakeMinter.publicKey,
        })
        .signers([fakeMinter, newMint])
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
      .signers([burnerKeypair])
      .rpc();

    try {
      await program.account.trailMintRecord.fetch(trailRecordPda);
      assert.fail("Account should be closed after burn");
    } catch (err) {
      assert.ok(err);
    }
  });

  // ─── Unauthorized Burn ───────────────────────────────────────────────────────

  it("rejects burn from an unauthorized signer", async () => {
    const fakeBurner = Keypair.generate();
    const dummyMint = Keypair.generate();

    const sig = await provider.connection.requestAirdrop(fakeBurner.publicKey, 2e9);
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .burnCertificate(Array.from(anotherTrailHash))
        .accounts({
          config: configPda,
          trailRecord: anotherTrailRecordPda,
          mint: dummyMint.publicKey,
          signer: fakeBurner.publicKey,
        })
        .signers([fakeBurner])
        .rpc();

      assert.fail("Expected unauthorized error");
    } catch (err: any) {
      assert.include(err.message, "Unauthorized");
    }
  });
});
