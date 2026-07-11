# Phase 4 — Write the Anchor Program

**Status:** ✅ Complete

> This is the main implementation phase. Complete Phase 2 and 3 before starting here.

---

## 4.1 State Structs

### `state/program_config.rs`

Replaces the OpenZeppelin `AccessControl` roles stored in the constructor.

```rust
use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,    // DEFAULT_ADMIN_ROLE
    pub minter: Pubkey,   // MINTER_ROLE
    pub burner: Pubkey,   // BURNER_ROLE
    pub bump: u8,
}

impl ProgramConfig {
    pub const LEN: usize = 8     // discriminator
        + 32                     // admin
        + 32                     // minter
        + 32                     // burner
        + 1;                     // bump
}
```

### `state/trail_mint_record.rs`

Replaces `mapping(bytes32 => bool) private _trailMinted`.

```rust
use anchor_lang::prelude::*;

#[account]
pub struct TrailMintRecord {
    pub trail_hash: [u8; 32],   // the trailHash key
    pub token_mint: Pubkey,     // which SPL mint was created for this trail
    pub bump: u8,
}

impl TrailMintRecord {
    pub const LEN: usize = 8   // discriminator
        + 32                   // trail_hash
        + 32                   // token_mint
        + 1;                   // bump
}
```

### `state/mod.rs`

```rust
pub mod program_config;
pub mod trail_mint_record;

pub use program_config::*;
pub use trail_mint_record::*;
```

---

## 4.2 Errors

### `errors.rs`

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

---

## 4.3 Instructions

### `instructions/initialize.rs`

Replaces the Solidity constructor.

```rust
use anchor_lang::prelude::*;
use crate::state::ProgramConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = ProgramConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    minter: Pubkey,
    burner: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.minter = minter;
    config.burner = burner;
    config.bump = ctx.bumps.config;
    Ok(())
}
```

---

### `instructions/mint_certificate.rs`

Replaces `safeMint(address to, string memory uri, bytes32 trailHash)`.

```rust
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
        CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::{errors::ErrorCode, state::{ProgramConfig, TrailMintRecord}};

#[derive(Accounts)]
#[instruction(trail_hash: [u8; 32])]
pub struct MintCertificate<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init,
        payer = signer,
        space = TrailMintRecord::LEN,
        seeds = [b"trail", trail_hash.as_ref()],
        bump
        // `init` fails automatically if the PDA already exists,
        // replacing: require(!_trailMinted[trailHash], "TRAIL_ALREADY_MINTED")
    )]
    pub trail_record: Account<'info, TrailMintRecord>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = signer,
        mint::freeze_authority = signer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Metaplex validates this account
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<MintCertificate>,
    trail_hash: [u8; 32],
    uri: String,
) -> Result<()> {
    // 1. Verify signer is the authorized minter
    require_keys_eq!(
        ctx.accounts.signer.key(),
        ctx.accounts.config.minter,
        ErrorCode::Unauthorized
    );

    // 2. Create Metaplex Token Metadata
    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.signer.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                update_authority: ctx.accounts.signer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: String::from("Web3EduBrasil"),
            symbol: String::from("W3EB"),
            uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        true,   // is_mutable
        true,   // update_authority_is_signer
        None,
    )?;

    // 3. Mint exactly 1 token to the recipient
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        1,
    )?;

    // 4. Record the trail as minted
    let record = &mut ctx.accounts.trail_record;
    record.trail_hash = trail_hash;
    record.token_mint = ctx.accounts.mint.key();
    record.bump = ctx.bumps.trail_record;

    Ok(())
}
```

---

### `instructions/burn_certificate.rs`

Replaces `burn(uint256 id)`.

```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{burn, Burn, Mint, Token, TokenAccount};
use crate::{errors::ErrorCode, state::{ProgramConfig, TrailMintRecord}};

#[derive(Accounts)]
#[instruction(trail_hash: [u8; 32])]
pub struct BurnCertificate<'info> {
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        seeds = [b"trail", trail_hash.as_ref()],
        bump = trail_record.bump,
        close = signer
    )]
    pub trail_record: Account<'info, TrailMintRecord>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = holder,
    )]
    pub holder_token_account: Account<'info, TokenAccount>,

    pub holder: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<BurnCertificate>,
    _trail_hash: [u8; 32],
) -> Result<()> {
    // Verify signer is the authorized burner
    require_keys_eq!(
        ctx.accounts.signer.key(),
        ctx.accounts.config.burner,
        ErrorCode::Unauthorized
    );

    // Burn the token (close = signer on trail_record returns rent to signer)
    burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.holder_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        1,
    )?;

    Ok(())
}
```

### `instructions/mod.rs`

```rust
pub mod initialize;
pub mod mint_certificate;
pub mod burn_certificate;
```

---

## 4.4 Program Entry Point

### `lib.rs`

```rust
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::{
    burn_certificate::BurnCertificate,
    initialize::Initialize,
    mint_certificate::MintCertificate,
};

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

---

## 4.5 Cargo.toml Dependencies

```toml
[dependencies]
anchor-lang = "0.31.0"
anchor-spl = { version = "0.31.0", features = ["token", "metadata", "associated_token"] }
mpl-token-metadata = "4.1.2"
```

---

## Build

```bash
anchor build
```

> Fix any compiler errors before moving to Phase 5.

---

## Checklist

- [x] `state/program_config.rs` written
- [x] `state/trail_mint_record.rs` written (+ uri field added)
- [x] `errors.rs` written
- [x] `instructions/initialize.rs` written
- [x] `instructions/mint_certificate.rs` written (Metaplex removido; URI stored in PDA)
- [x] `instructions/burn_certificate.rs` written
- [x] `lib.rs` entry point written
- [x] `anchor build` succeeds with no errors

---

[Previous: Phase 3 — Project Structure](./phase-3-project-structure.md) | [Next: Phase 5 — Anchor.toml Config](./phase-5-anchor-toml.md)
