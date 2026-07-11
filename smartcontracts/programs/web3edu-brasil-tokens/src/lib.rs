use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::burn_certificate::*;
use instructions::initialize::*;
use instructions::mint_certificate::*;

declare_id!("2GqcF3UeuJ7f2RtwVSTjNgojbkEuyEsGptbNR1eZUEqQ");

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
