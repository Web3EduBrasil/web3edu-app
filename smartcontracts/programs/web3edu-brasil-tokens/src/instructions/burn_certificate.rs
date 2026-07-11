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
    require_keys_eq!(
        ctx.accounts.signer.key(),
        ctx.accounts.config.burner,
        ErrorCode::Unauthorized
    );

    burn(
        CpiContext::new(
            anchor_spl::token::ID,
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
