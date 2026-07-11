# Solana Migration — Overview

Migration of `Web3EduBrasilTokens` from EVM (Solidity + Hardhat) to Solana (Rust + Anchor).

## Quick Reference

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

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | [Environment Setup](./phase-1-environment-setup.md) | ✅ Done |
| 2 | [Architecture Shift](./phase-2-architecture.md) | ✅ Done |
| 3 | [Project Structure](./phase-3-project-structure.md) | ✅ Done |
| 4 | [Write the Anchor Program](./phase-4-anchor-program.md) | |
| 5 | [Anchor.toml Config](./phase-5-anchor-toml.md) | |
| 6 | [Testing](./phase-6-testing.md) | |
| 7 | [Deployment](./phase-7-deployment.md) | |
| 8 | [Frontend / Client Update](./phase-8-frontend.md) | |

---

## Effort Estimate

| Phase | Effort |
|---|---|
| 1 — Env setup | ~2h |
| 2 — Architecture study | ~4h |
| 3-4 — Write Anchor program | ~2–3 days |
| 5-6 — Tests | ~1 day |
| 7 — Deploy | ~2h |
| 8 — Frontend | ~1–2 days |

---

## Recommended Learning Path

1. [Anchor Book](https://book.anchor-lang.com) — start here before writing any Rust
2. [Solana Cookbook](https://solanacookbook.com) — patterns for accounts, PDAs, CPIs
3. [Metaplex Token Metadata docs](https://developers.metaplex.com/token-metadata) — NFT minting via CPI
4. [Anchor examples repo](https://github.com/coral-xyz/anchor/tree/master/examples) — reference implementations
