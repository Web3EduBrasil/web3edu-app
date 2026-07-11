# Phase 2 — Architecture Shift

**Status:** ✅ Done (2026-07-10)

> Read this entire phase before writing any code. The mental model shift from EVM to Solana is the single biggest source of bugs during migration.

---

## The Core Difference

**Solidity contracts are stateful.** The contract itself holds its state in storage slots.

**Solana programs are stateless.** The program holds only logic. All state lives in separate **accounts** that your program reads and writes.

```
EVM model:
  Contract { storage: { _trailMinted: {...}, _nextTokenId: 5 } }

Solana model:
  Program (logic only)
  Account A: ProgramConfig { admin, minter, burner }
  Account B: TrailMintRecord { trail_hash, token_mint }
  Account C: TrailMintRecord { trail_hash, token_mint }
  ...
```

---

## Key Concepts

### Program Derived Addresses (PDAs)

A PDA is a deterministic on-chain address derived from seeds + your program ID. It has no private key — only your program can sign for it.

This replaces Solidity mappings:

```
// Solidity
mapping(bytes32 => bool) private _trailMinted;
_trailMinted[trailHash] = true;

// Solana
PDA address = hash(["trail", trail_hash, program_id])
If this account exists → trail was minted
If this account does not exist → trail was not minted
```

### Cross-Program Invocations (CPIs)

Your program cannot mint SPL tokens or create Metaplex metadata directly — it must call other programs. These calls are CPIs, equivalent to calling an external contract in Solidity.

Your program will CPI into:
- **SPL Token Program** — to create the mint and issue the token
- **Metaplex Token Metadata Program** — to attach name, symbol, and URI

### Signers vs. `msg.sender`

In Solidity, `msg.sender` is always available. In Anchor, you declare which accounts must sign a transaction as constraints on the instruction context. Unauthorized calls are rejected before your code even runs.

---

## Account Map for This Project

| Account | Seeds | Replaces |
|---|---|---|
| `ProgramConfig` PDA | `["config"]` | Constructor args + role storage |
| `TrailMintRecord` PDA | `["trail", trail_hash]` | `_trailMinted[trailHash]` |
| SPL `Mint` account | generated per certificate | The ERC-721 token ID |
| Metaplex `Metadata` account | derived by Metaplex from mint | `tokenURI(tokenId)` |

---

## Concepts to Internalize Before Phase 4

| Concept | Why it matters |
|---|---|
| Accounts vs. storage | Programs hold no state; accounts do |
| PDAs | Deterministic addresses replace Solidity mappings |
| CPIs | How your program calls SPL Token and Metaplex |
| Rent | Accounts must hold SOL to stay alive |
| Transaction size limits | ~1232 bytes per tx; NFT minting may need multiple transactions |

---

## Resources

- [Anchor Book — Accounts](https://book.anchor-lang.com/anchor_in_depth/the_accounts_struct.html)
- [Solana Cookbook — PDAs](https://solanacookbook.com/core-concepts/pdas.html)
- [Solana Cookbook — CPIs](https://solanacookbook.com/core-concepts/cpi.html)

---

## Checklist

- [x] Understand why programs are stateless
- [x] Understand how PDAs replace mappings
- [x] Understand what a CPI is
- [x] Read the Anchor Book accounts chapter

---

[Previous: Phase 1 — Environment Setup](./phase-1-environment-setup.md) | [Next: Phase 3 — Project Structure](./phase-3-project-structure.md)
