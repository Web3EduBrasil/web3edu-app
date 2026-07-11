# Phase 1 — Environment Setup

**Status:** [ ] Not started

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

- [ ] `rustc --version` returns output
- [ ] `solana --version` returns output
- [ ] `solana balance` shows SOL on devnet
- [ ] `anchor --version` returns output

---

[Next: Phase 2 — Architecture Shift](./phase-2-architecture.md)
