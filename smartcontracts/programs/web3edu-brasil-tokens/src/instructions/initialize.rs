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
