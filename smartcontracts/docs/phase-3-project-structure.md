# Phase 3 — Project Structure

**Status:** ✅ Done (2026-07-10)

---

## Scaffold the Anchor Project

Inside `smartcontracts/`, replace the Hardhat setup with a new Anchor project:

```bash
cd smartcontracts
anchor init web3edu-brasil-tokens --no-git
```

This generates the base structure. Then reorganize it to match the layout below.

---

## Target Folder Structure

```
smartcontracts/
├── Anchor.toml                          # replaces hardhat.config.ts
├── Cargo.toml                           # Rust workspace manifest
├── package.json                         # for TypeScript tests
├── tsconfig.json
├── .env                                 # keep for wallet/RPC secrets
├── docs/                                # this migration guide
├── programs/
│   └── web3edu-brasil-tokens/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs                   # program entry point (replaces .sol)
│           ├── instructions/
│           │   ├── mod.rs
│           │   ├── initialize.rs        # replaces constructor()
│           │   ├── mint_certificate.rs  # replaces safeMint()
│           │   └── burn_certificate.rs  # replaces burn()
│           ├── state/
│           │   ├── mod.rs
│           │   ├── program_config.rs    # replaces AccessControl roles
│           │   └── trail_mint_record.rs # replaces _trailMinted mapping
│           └── errors.rs
└── tests/
    └── web3edu-brasil-tokens.ts         # TypeScript tests (like Hardhat)
```

---

## What Replaces What

| Hardhat / Solidity file | Anchor / Rust equivalent |
|---|---|
| `contracts/Web3EduBrasilToken.sol` | `programs/web3edu-brasil-tokens/src/lib.rs` |
| OpenZeppelin `AccessControl` | `state/program_config.rs` |
| `_trailMinted` mapping | `state/trail_mint_record.rs` |
| `ignition/modules/Web3EduBrasilTokens.ts` | `Anchor.toml` + `anchor deploy` |
| `hardhat.config.ts` | `Anchor.toml` |
| `test/` (Hardhat) | `tests/` (Anchor / Mocha) |

---

## Workspace Cargo.toml

```toml
[workspace]
members = ["programs/*"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
increments = false
```

---

## package.json for Tests

```json
{
  "scripts": {
    "test": "yarn ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
  },
  "devDependencies": {
    "@coral-xyz/anchor": "^0.31.0",
    "@solana/web3.js": "^1.98.0",
    "@types/chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "chai": "^4.3.0",
    "mocha": "^10.0.0",
    "ts-mocha": "^10.0.0",
    "typescript": "~5.8.0"
  }
}
```

---

## Checklist

- [x] `anchor init` scaffold created
- [x] Folder structure matches layout above
- [x] `Cargo.toml` workspace configured
- [x] `package.json` updated with Anchor test dependencies
- [x] Old Hardhat files removed (`hardhat.config.ts`, `ignition/`, `@openzeppelin` deps)

---

[Previous: Phase 2 — Architecture Shift](./phase-2-architecture.md) | [Next: Phase 4 — Write the Anchor Program](./phase-4-anchor-program.md)
