# Phase 5 — Anchor.toml Config

**Status:** ✅ Complete

> `Anchor.toml` replaces `hardhat.config.ts`. It tells Anchor which network to target, where your wallet is, and what your program IDs are.

---

## Get Your Program ID

After running `anchor build` in Phase 4, get the program ID:

```bash
solana address -k target/deploy/web3edu_brasil_tokens-keypair.json
```

Copy the output — you will need it in the next step.

---

## Update `declare_id!` in `lib.rs`

Open `programs/web3edu-brasil-tokens/src/lib.rs` and replace the placeholder:

```rust
// before
declare_id!("YOUR_PROGRAM_ID_HERE");

// after
declare_id!("PASTE_YOUR_PROGRAM_ID_HERE");
```

Then rebuild:

```bash
anchor build
```

---

## Anchor.toml

```toml
[features]
seeds = true
skip-lint = false

[programs.localnet]
web3edu_brasil_tokens = "YOUR_PROGRAM_ID_HERE"

[programs.devnet]
web3edu_brasil_tokens = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
web3edu_brasil_tokens = "YOUR_PROGRAM_ID_HERE"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 5000
shutdown_wait = 2000
```

---

## Network Reference

| Network | `cluster` value | Use for |
|---|---|---|
| Local validator | `"Localnet"` | Fast local dev |
| Devnet | `"Devnet"` | Testing with free SOL |
| Mainnet | `"Mainnet"` | Production |

To switch networks without editing `Anchor.toml`:

```bash
anchor deploy --provider.cluster devnet
anchor deploy --provider.cluster mainnet-beta
```

---

## Comparison: hardhat.config.ts vs Anchor.toml

| Hardhat | Anchor.toml equivalent |
|---|---|
| `networks.sepolia.url` | `[provider] cluster = "Devnet"` |
| `networks.sepolia.accounts` | `[provider] wallet = "~/.config/solana/id.json"` |
| `solidity.version` | Rust toolchain version in `rust-toolchain.toml` |
| Plugin list | Cargo.toml dependencies |

---

## Checklist

- [ ] Program ID retrieved from `target/deploy/`
- [ ] `declare_id!` updated in `lib.rs`
- [ ] `Anchor.toml` created with correct program ID in all network sections
- [ ] `anchor build` succeeds after ID update

---

[Previous: Phase 4 — Write the Anchor Program](./phase-4-anchor-program.md) | [Next: Phase 6 — Testing](./phase-6-testing.md)
