# Phase 7 — Deployment

**Status:** [ ] Not started

> Complete Phases 1–6 and ensure all tests pass before deploying.

---

## Pre-Deployment Checklist

- [ ] `anchor build` succeeds with no warnings
- [ ] `anchor test` passes all cases locally
- [ ] `declare_id!` in `lib.rs` matches the keypair in `target/deploy/`
- [ ] `Anchor.toml` has the correct program ID for each network
- [ ] Deployer wallet has enough SOL (at least 2–5 SOL for Devnet, check costs for Mainnet)

---

## Step 1 — Build for Production

```bash
anchor build -- --profile production
```

This enables the optimizer defined in `Cargo.toml` and reduces the program binary size.

---

## Step 2 — Check Deployer Balance

```bash
# Devnet
solana balance --url devnet

# Mainnet
solana balance --url mainnet-beta
```

If low on Devnet:
```bash
solana airdrop 2 --url devnet
```

---

## Step 3 — Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

Expected output:
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: <your-wallet-address>
Deploying program "web3edu-brasil-tokens"...
Program Id: <your-program-id>
Deploy success
```

---

## Step 4 — Initialize the Program on Devnet

After deployment the program exists but has no config account yet. Run the initialize instruction once:

```bash
# Using a custom deploy script
npx ts-node scripts/initialize.ts --cluster devnet \
  --minter <MINTER_PUBKEY> \
  --burner <BURNER_PUBKEY>
```

Or write a small TypeScript script:

```typescript
// scripts/initialize.ts
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Web3EduBrasilTokens;

  const minter = new PublicKey(process.env.MINTER_PUBKEY!);
  const burner = new PublicKey(process.env.BURNER_PUBKEY!);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const tx = await program.methods
    .initialize(minter, burner)
    .accounts({
      config: configPda,
      admin: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Initialized. Tx:", tx);
  console.log("Config PDA:", configPda.toBase58());
}

main().catch(console.error);
```

---

## Step 5 — Verify on Devnet Explorer

```
https://explorer.solana.com/address/<YOUR_PROGRAM_ID>?cluster=devnet
```

Check that:
- Program is marked as executable
- Config PDA account exists

---

## Step 6 — Run Integration Tests Against Devnet

```bash
anchor test --provider.cluster devnet
```

---

## Step 7 — Deploy to Mainnet

Only after Devnet is fully validated:

```bash
anchor deploy --provider.cluster mainnet-beta
```

> Mainnet deployment costs real SOL (~1.5–3 SOL depending on program size). Verify the program binary size with `ls -lh target/deploy/web3edu_brasil_tokens.so` before deploying.

---

## Step 8 — Initialize on Mainnet

Repeat the initialize script targeting mainnet:

```bash
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
MINTER_PUBKEY=<MINTER_ADDRESS> \
BURNER_PUBKEY=<BURNER_ADDRESS> \
npx ts-node scripts/initialize.ts
```

---

## Comparison: Hardhat deploy vs Anchor deploy

| Hardhat | Anchor |
|---|---|
| `hardhat ignition deploy` | `anchor deploy` |
| Ignition module file | `Anchor.toml` program ID sections |
| `--network sepolia` | `--provider.cluster devnet` |
| Constructor args in module | Separate `initialize` instruction after deploy |

---

## Checklist

- [ ] `anchor build` with production profile succeeds
- [ ] Deployed to Devnet — program ID confirmed
- [ ] `initialize` instruction run on Devnet
- [ ] Verified on Devnet Explorer
- [ ] Integration tests pass on Devnet
- [ ] Deployed to Mainnet
- [ ] `initialize` instruction run on Mainnet
- [ ] Verified on Mainnet Explorer

---

[Previous: Phase 6 — Testing](./phase-6-testing.md) | [Next: Phase 8 — Frontend / Client Update](./phase-8-frontend.md)
