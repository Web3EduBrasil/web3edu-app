use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub minter: Pubkey,
    pub burner: Pubkey,
    pub bump: u8,
}

impl ProgramConfig {
    pub const LEN: usize = 8  // discriminator
        + 32                  // admin
        + 32                  // minter
        + 32                  // burner
        + 1;                  // bump
}
