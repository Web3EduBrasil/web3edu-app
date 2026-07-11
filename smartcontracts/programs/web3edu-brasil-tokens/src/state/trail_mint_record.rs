use anchor_lang::prelude::*;

#[account]
pub struct TrailMintRecord {
    pub trail_hash: [u8; 32],
    pub token_mint: Pubkey,
    pub uri: String,
    pub bump: u8,
}

impl TrailMintRecord {
    pub const URI_MAX_LEN: usize = 200;

    pub const LEN: usize = 8                    // discriminator
        + 32                                     // trail_hash
        + 32                                     // token_mint
        + 4 + Self::URI_MAX_LEN                  // uri (length prefix + bytes)
        + 1;                                     // bump
}
