use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Signer does not have the required authority")]
    Unauthorized,
    #[msg("This trail has already been minted")]
    TrailAlreadyMinted,
}
