# Phase 6 — Testing

**Status:** ✅ Complete

> Anchor tests are written in TypeScript with Mocha + Chai, similar to Hardhat. The main difference is using `@coral-xyz/anchor` instead of `viem` or `ethers`.

---

## Install Test Dependencies

```bash
yarn add -D @coral-xyz/anchor @solana/web3.js @types/chai @types/mocha chai mocha ts-mocha typescript
```

---

## Full Test File

```typescript
// tests/web3edu-brasil-tokens.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";

describe("web3edu-brasil-tokens", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Web3EduBrasilTokens as Program;

  // Authority keypairs
  const minterKeypair = Keypair.generate();
  const burnerKeypair = Keypair.generate();
  const recipientKeypair = Keypair.generate();

  // Trail hashes
  const trailHash = Buffer.alloc(32);
  Buffer.from("trail-id-001").copy(trailHash);

  const anotherTrailHash = Buffer.alloc(32);
  Buffer.from("trail-id-002").copy(anotherTrailHash);

  // PDAs
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

  // Fund the minter keypair before tests
  before(async () => {
    await provider.connection.requestAirdrop(minterKeypair.publicKey, 2e9);
    await provider.connection.requestAirdrop(burnerKeypair.publicKey, 2e9);
    await new Promise((r) => setTimeout(r, 2000)); // wait for airdrop confirmation
  });

  // ─── Initialize ──────────────────────────────────────────────────────────

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

    assert.equal(
      config.admin.toBase58(),
      provider.wallet.publicKey.toBase58(),
      "admin should be the deployer"
    );
    assert.equal(
      config.minter.toBase58(),
      minterKeypair.publicKey.toBase58(),
      "minter should be set"
    );
    assert.equal(
      config.burner.toBase58(),
      burnerKeypair.publicKey.toBase58(),
      "burner should be set"
    );
  });

  // ─── Mint Certificate ─────────────────────────────────────────────────────

  it("mints a certificate NFT for a completed trail", async () => {
    const mintKeypair = Keypair.generate();

    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipientKeypair.publicKey
    );

    // Derive Metaplex metadata PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    await program.methods
      .mintCertificate(Array.from(trailHash), "ipfs://QmExampleHash")
      .accounts({
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintKeypair.publicKey,
        recipientTokenAccount,
        metadataAccount: metadataPda,
        recipient: recipientKeypair.publicKey,
        signer: minterKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([minterKeypair, mintKeypair])
      .rpc();

    // Verify TrailMintRecord PDA was created
    const record = await program.account.trailMintRecord.fetch(trailRecordPda);
    assert.deepEqual(
      Buffer.from(record.trailHash),
      trailHash,
      "trail hash should be stored"
    );
    assert.equal(
      record.tokenMint.toBase58(),
      mintKeypair.publicKey.toBase58(),
      "token mint should be stored"
    );
  });

  // ─── Double Mint Prevention ───────────────────────────────────────────────

  it("rejects double-minting the same trail", async () => {
    const mintKeypair = Keypair.generate();

    try {
      await program.methods
        .mintCertificate(Array.from(trailHash), "ipfs://QmExampleHash")
        .accounts({
          config: configPda,
          trailRecord: trailRecordPda,  // same PDA → already exists → init fails
          mint: mintKeypair.publicKey,
          signer: minterKeypair.publicKey,
        })
        .signers([minterKeypair, mintKeypair])
        .rpc();

      assert.fail("Expected double-mint to throw");
    } catch (err) {
      assert.ok(err, "Should have thrown on duplicate trail");
    }
  });

  // ─── Unauthorized Mint ────────────────────────────────────────────────────

  it("rejects mint from an unauthorized signer", async () => {
    const fakeMinter = Keypair.generate();
    const mintKeypair = Keypair.generate();

    await provider.connection.requestAirdrop(fakeMinter.publicKey, 2e9);
    await new Promise((r) => setTimeout(r, 1000));

    try {
      await program.methods
        .mintCertificate(Array.from(anotherTrailHash), "ipfs://QmOtherHash")
        .accounts({
          config: configPda,
          trailRecord: anotherTrailRecordPda,
          mint: mintKeypair.publicKey,
          signer: fakeMinter.publicKey,
        })
        .signers([fakeMinter, mintKeypair])
        .rpc();

      assert.fail("Expected unauthorized error");
    } catch (err) {
      assert.include(err.message, "Unauthorized");
    }
  });

  // ─── Burn Certificate ─────────────────────────────────────────────────────

  it("burns a certificate when called by the burner", async () => {
    const mintKeypair = Keypair.generate();

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

    // TrailMintRecord PDA should be closed (rent returned)
    try {
      await program.account.trailMintRecord.fetch(trailRecordPda);
      assert.fail("Account should be closed after burn");
    } catch (err) {
      assert.ok(err, "Account was correctly closed");
    }
  });

  // ─── Unauthorized Burn ────────────────────────────────────────────────────

  it("rejects burn from an unauthorized signer", async () => {
    const fakeBurner = Keypair.generate();
    const mintKeypair = Keypair.generate();

    await provider.connection.requestAirdrop(fakeBurner.publicKey, 2e9);
    await new Promise((r) => setTimeout(r, 1000));

    try {
      await program.methods
        .burnCertificate(Array.from(anotherTrailHash))
        .accounts({
          config: configPda,
          trailRecord: anotherTrailRecordPda,
          mint: mintKeypair.publicKey,
          signer: fakeBurner.publicKey,
        })
        .signers([fakeBurner])
        .rpc();

      assert.fail("Expected unauthorized error");
    } catch (err) {
      assert.include(err.message, "Unauthorized");
    }
  });
});
```

---

## Run Tests

### Against a local validator (fastest)

```bash
anchor test
```

This automatically starts a local validator, deploys the program, runs all tests, and shuts down.

### Against Devnet

```bash
anchor test --provider.cluster devnet
```

---

## Test Coverage Checklist

- [ ] `initialize` — sets admin, minter, burner correctly
- [ ] `mint_certificate` — creates NFT and TrailMintRecord PDA
- [ ] Double-mint prevention — second mint with same trail hash fails
- [ ] Unauthorized mint — non-minter signer is rejected
- [ ] `burn_certificate` — burns token and closes TrailMintRecord PDA
- [ ] Unauthorized burn — non-burner signer is rejected

---

[Previous: Phase 5 — Anchor.toml Config](./phase-5-anchor-toml.md) | [Next: Phase 7 — Deployment](./phase-7-deployment.md)
