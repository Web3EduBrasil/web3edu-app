# Phase 1 — Environment Setup

**Status:** ✅ Done (2026-07-10) — Rust 1.96, Solana CLI 4.1.1, Anchor CLI 1.1.2, wallet FfGBBHsi3e7Q57BMHAnVchBtseb1t9ragdFHcm2VJeN6 on devnet

---

## 1.1 Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update stable
rustup component add rustfmt clippy
```

**Verify:**
```bash
rustc --version
cargo --version
```

---

## 1.2 Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

**Verify:**
```bash
solana --version
```

---

## 1.3 Create a Local Wallet

```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --keypair ~/.config/solana/id.json
solana config set --url devnet
solana airdrop 2
```

**Verify:**
```bash
solana balance
solana address
```

> Keep `~/.config/solana/id.json` safe. This is your deployer wallet — never commit it to git.

---

## 1.4 Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

**Verify:**
```bash
anchor --version
```

> Expected: `anchor-cli 0.31.x` or later.

---

## Checklist

- [x] `rustc --version` returns output
- [x] `solana --version` returns output
- [ ] `solana balance` shows SOL on devnet (airdrop rate-limited — use faucet.solana.com)
- [x] `anchor --version` returns output

---

[Next: Phase 2 — Architecture Shift](./phase-2-architecture.md)
