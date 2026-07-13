use anchor_lang::prelude::*;
use crate::state::ProgramConfig;

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, ProgramConfig>,

    pub admin: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateConfig>,
    minter: Pubkey,
    burner: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.minter = minter;
    config.burner = burner;
    Ok(())
}
