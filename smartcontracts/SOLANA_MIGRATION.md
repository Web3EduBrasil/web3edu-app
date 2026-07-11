# Migration Plan: EVM → Solana

## Current State

The contract `Web3EduBrasilTokens` is an **ERC-721 NFT (certificate) program** with:

- Role-based access control (Admin, Minter, Burner)
- Trail deduplication (`_trailMinted` mapping — prevents double-minting per trail)
- IPFS-based metadata URIs
- Toolchain: Hardhat + OpenZeppelin, deployed to Sepolia

---

## Conceptual Mapping

| EVM | Solana Equivalent |
|---|---|
| Solidity | Rust + Anchor framework |
| ERC-721 NFT | SPL Token (supply=1) + Metaplex Token Metadata |
| OpenZeppelin `AccessControl` | Authority pubkeys stored in a config PDA |
| `mapping(bytes32 => bool)` | PDA account keyed by trail hash |
| Hardhat | Anchor CLI |
| Viem / ethers.js | @solana/web3.js + @metaplex-foundation/umi |
| Sepolia testnet | Solana Devnet |
| `.env` private key hex | Solana keypair JSON file |
| `msg.sender` check | Signer account constraint in Anchor |

---

## Phase 1 — Environment Setup

### 1.1 Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable
rustup component add rustfmt clippy
```

### 1.2 Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version
```

### 1.3 Create a local wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --keypair ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2
```

### 1.4 Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
anchor --version
```

---

## Phase 2 — Understand the Architecture Shift

This is the most important conceptual step before writing any code.

**Solana programs are stateless.** All data lives in separate **accounts**, not inside the program itself. Your program only holds logic; accounts hold state.

The three key account types you will use:

| Account | What it stores | How it is derived |
|---|---|---|
| `ProgramConfig` PDA | admin / minter / burner pubkeys | `["config"]` seed |
| `TrailMintRecord` PDA | whether a trail hash was minted | `["trail", trail_hash]` seed |
| `Mint` account (SPL) | the NFT token mint | generated per certificate |
| `Metadata` account | name, symbol, URI (via Metaplex) | derived by Metaplex from mint address |

**PDA = Program Derived Address** — a deterministic on-chain address based on seeds + your program ID. This replaces the `mapping(bytes32 => bool)` from Solidity.

---

## Phase 3 — Project Structure

Replace the `smartcontracts/` folder with:

```
smartcontracts/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── web3edu-brasil-tokens/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs
│           ├── instructions/
│           │   ├── initialize.rs
│           │   ├── mint_certificate.rs
│           │   └── burn_certificate.rs
│           ├── state/
│           │   ├── program_config.rs
│           │   └── trail_mint_record.rs
│           └── errors.rs
└── tests/
    └── web3edu-brasil-tokens.ts
```

---

## Phase 4 — Write the Anchor Program

### 4.1 Account state structs

```rust
// state/program_config.rs
#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub minter: Pubkey,
    pub burner: Pubkey,
    pub bump: u8,
}

// state/trail_mint_record.rs
#[account]
pub struct TrailMintRecord {
    pub trail_hash: [u8; 32],
    pub token_mint: Pubkey,
    pub bump: u8,
}
```

### 4.2 Instructions mapping

| Original Solidity | Anchor instruction |
|---|---|
| `constructor(admin, minter, burner)` | `initialize(ctx, admin, minter, burner)` |
| `safeMint(to, uri, trailHash)` | `mint_certificate(ctx, trail_hash, uri)` |
| `hasTrailMinted(trailHash)` | Read `TrailMintRecord` PDA off-chain (no instruction needed) |
| `burn(id)` | `burn_certificate(ctx, trail_hash)` |

### 4.3 `lib.rs` entry point

```rust
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod web3edu_brasil_tokens {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        minter: Pubkey,
        burner: Pubkey,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, minter, burner)
    }

    pub fn mint_certificate(
        ctx: Context<MintCertificate>,
        trail_hash: [u8; 32],
        uri: String,
    ) -> Result<()> {
        instructions::mint_certificate::handler(ctx, trail_hash, uri)
    }

    pub fn burn_certificate(
        ctx: Context<BurnCertificate>,
        trail_hash: [u8; 32],
    ) -> Result<()> {
        instructions::burn_certificate::handler(ctx, trail_hash)
    }
}
```

### 4.4 `mint_certificate` core logic

```rust
// instructions/mint_certificate.rs
pub fn handler(
    ctx: Context<MintCertificate>,
    trail_hash: [u8; 32],
    uri: String,
) -> Result<()> {
    // 1. Check signer is the minter authority
    require_keys_eq!(
        ctx.accounts.signer.key(),
        ctx.accounts.config.minter,
        ErrorCode::Unauthorized
    );

    // 2. The TrailMintRecord PDA existing means it was already minted.
    //    Anchor's `init` constraint will fail automatically if the PDA exists.
    //    This replaces: require(!_trailMinted[trailHash], "TRAIL_ALREADY_MINTED")

    // 3. Create the SPL Token Mint (supply=1, decimals=0) via CPI to Token Program

    // 4. Create Metaplex Token Metadata via CPI to Token Metadata Program
    //    name = "Web3EduBrasil", symbol = "W3EB", uri = uri

    // 5. Mint 1 token to the recipient's associated token account

    // 6. Remove mint authority so supply is forever locked at 1

    // 7. Initialize the TrailMintRecord PDA
    let record = &mut ctx.accounts.trail_record;
    record.trail_hash = trail_hash;
    record.token_mint = ctx.accounts.mint.key();
    record.bump = ctx.bumps.trail_record;

    Ok(())
}
```

### 4.5 `errors.rs`

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Signer does not have the required authority")]
    Unauthorized,
    #[msg("This trail has already been minted")]
    TrailAlreadyMinted,
}
```

### 4.6 Cargo.toml dependencies

```toml
[dependencies]
anchor-lang = "0.31.0"
anchor-spl = { version = "0.31.0", features = ["token", "metadata"] }
mpl-token-metadata = "4.1.2"
```

---

## Phase 5 — Anchor.toml (replaces hardhat.config.ts)

```toml
[features]
seeds = true

[programs.devnet]
web3edu_brasil_tokens = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
web3edu_brasil_tokens = "YOUR_PROGRAM_ID_HERE"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

---

## Phase 6 — Testing (TypeScript, same as Hardhat pattern)

```typescript
// tests/web3edu-brasil-tokens.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("web3edu-brasil-tokens", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Web3EduBrasilTokens as Program;

  const minterKeypair = Keypair.generate();
  const burnerKeypair = Keypair.generate();
  const recipientKeypair = Keypair.generate();

  const trailHash = Buffer.alloc(32);
  Buffer.from("trail-id-001").copy(trailHash);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [trailRecordPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("trail"), trailHash],
    program.programId
  );

  it("initializes the program", async () => {
    await program.methods
      .initialize(minterKeypair.publicKey, burnerKeypair.publicKey)
      .accounts({ config: configPda, admin: provider.wallet.publicKey })
      .rpc();

    const config = await program.account.programConfig.fetch(configPda);
    assert.equal(config.minter.toBase58(), minterKeypair.publicKey.toBase58());
    assert.equal(config.burner.toBase58(), burnerKeypair.publicKey.toBase58());
  });

  it("mints a certificate NFT for a completed trail", async () => {
    const mintKeypair = Keypair.generate();

    await program.methods
      .mintCertificate(Array.from(trailHash), "ipfs://QmXxx")
      .accounts({
        signer: minterKeypair.publicKey,
        config: configPda,
        trailRecord: trailRecordPda,
        mint: mintKeypair.publicKey,
        recipient: recipientKeypair.publicKey,
      })
      .signers([minterKeypair, mintKeypair])
      .rpc();

    const record = await program.account.trailMintRecord.fetch(trailRecordPda);
    assert.ok(record.trailHash);
  });

  it("rejects double-minting the same trail", async () => {
    const mintKeypair = Keypair.generate();

    try {
      await program.methods
        .mintCertificate(Array.from(trailHash), "ipfs://QmXxx")
        .accounts({
          signer: minterKeypair.publicKey,
          config: configPda,
          trailRecord: trailRecordPda,
          mint: mintKeypair.publicKey,
          recipient: recipientKeypair.publicKey,
        })
        .signers([minterKeypair, mintKeypair])
        .rpc();

      assert.fail("Should have thrown");
    } catch (err) {
      assert.ok(err);
    }
  });

  it("rejects mint from unauthorized signer", async () => {
    const fakeMinter = Keypair.generate();
    const mintKeypair = Keypair.generate();
    const anotherHash = Buffer.alloc(32);
    Buffer.from("trail-id-002").copy(anotherHash);

    const [anotherTrailPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trail"), anotherHash],
      program.programId
    );

    try {
      await program.methods
        .mintCertificate(Array.from(anotherHash), "ipfs://QmYyy")
        .accounts({
          signer: fakeMinter.publicKey,
          config: configPda,
          trailRecord: anotherTrailPda,
          mint: mintKeypair.publicKey,
          recipient: recipientKeypair.publicKey,
        })
        .signers([fakeMinter, mintKeypair])
        .rpc();

      assert.fail("Should have thrown");
    } catch (err) {
      assert.include(err.message, "Unauthorized");
    }
  });

  it("burns a certificate", async () => {
    await program.methods
      .burnCertificate(Array.from(trailHash))
      .accounts({
        signer: burnerKeypair.publicKey,
        config: configPda,
        trailRecord: trailRecordPda,
      })
      .signers([burnerKeypair])
      .rpc();
  });
});
```

---

## Phase 7 — Deployment Commands

```bash
# 1. Build the program
anchor build

# 2. Get your program ID
solana address -k target/deploy/web3edu_brasil_tokens-keypair.json

# 3. Update declare_id!("...") in lib.rs and Anchor.toml with that ID, then rebuild
anchor build

# 4. Deploy to Devnet
anchor deploy --provider.cluster devnet

# 5. Run tests against Devnet
anchor test --provider.cluster devnet

# 6. Deploy to Mainnet when ready
anchor deploy --provider.cluster mainnet-beta
```

---

## Phase 8 — Frontend / Client Update

Your Next.js app currently uses `viem`. Replace contract calls with `@coral-xyz/anchor`.

### Install new dependencies

```bash
npm install @solana/web3.js @coral-xyz/anchor @metaplex-foundation/umi
npm uninstall viem
```

### Before (viem + EVM)

```typescript
await contract.write.safeMint([userAddress, ipfsUri, trailHashBytes32]);
```

### After (@coral-xyz/anchor + Solana)

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const [trailRecordPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("trail"), trailHashBytes],
  programId
);

await program.methods
  .mintCertificate(Array.from(trailHashBytes), ipfsUri)
  .accounts({
    signer: minterPublicKey,
    config: configPda,
    trailRecord: trailRecordPda,
    mint: mintKeypair.publicKey,
    recipient: userPublicKey,
  })
  .signers([minterKeypair, mintKeypair])
  .rpc();
```

### Checking if a trail was minted (replaces `hasTrailMinted`)

```typescript
const [trailRecordPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("trail"), trailHashBytes],
  programId
);

try {
  const record = await program.account.trailMintRecord.fetch(trailRecordPda);
  return true; // account exists = already minted
} catch {
  return false; // account does not exist = not minted
}
```

---

## Migration Effort Summary

| Task | Effort | Notes |
|---|---|---|
| Phase 1 — Env setup | ~2h | One-time; follow docs closely |
| Phase 2 — Architecture study | ~4h | Critical; read Anchor Book before coding |
| Phase 3-4 — Write Anchor program | ~2–3 days | Main work; Metaplex CPI is the hardest part |
| Phase 5-6 — Tests | ~1 day | Similar pattern to Hardhat |
| Phase 7 — Deploy | ~2h | Straightforward once tests pass |
| Phase 8 — Frontend | ~1–2 days | Swap viem for @solana/web3.js |

---

## Recommended Learning Path

1. [Anchor Book](https://book.anchor-lang.com) — start here before writing any Rust
2. [Solana Cookbook](https://solanacookbook.com) — patterns for accounts, PDAs, CPIs
3. [Metaplex Token Metadata docs](https://developers.metaplex.com/token-metadata) — NFT minting via CPI
4. [Anchor examples repo](https://github.com/coral-xyz/anchor/tree/master/examples) — reference implementations

---

## Key Concepts to Internalize Before Coding

| Concept | Why it matters |
|---|---|
| **Accounts vs. storage** | Solana programs hold no state; accounts do |
| **PDAs** | Deterministic addresses — your replacement for Solidity mappings |
| **CPIs (Cross-Program Invocations)** | How your program calls SPL Token and Metaplex programs |
| **Rent** | Accounts must hold SOL to stay alive; consider `rent_exempt` |
| **Transaction size limits** | ~1232 bytes per tx; NFT minting may need multiple transactions |
