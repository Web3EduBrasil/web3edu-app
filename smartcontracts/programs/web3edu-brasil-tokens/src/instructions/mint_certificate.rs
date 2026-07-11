use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
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
        // `init` fails if PDA already exists — prevents double-minting the same trail
    )]
    pub trail_record: Account<'info, TrailMintRecord>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = signer,
        token::token_program = token_program,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub recipient: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<MintCertificate>,
    trail_hash: [u8; 32],
    uri: String,
) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.signer.key(),
        ctx.accounts.config.minter,
        ErrorCode::Unauthorized
    );

    mint_to(
        CpiContext::new(
            anchor_spl::token::ID,
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        1,
    )?;

    let record = &mut ctx.accounts.trail_record;
    record.trail_hash = trail_hash;
    record.token_mint = ctx.accounts.mint.key();
    record.uri = uri;
    record.bump = ctx.bumps.trail_record;

    Ok(())
}
