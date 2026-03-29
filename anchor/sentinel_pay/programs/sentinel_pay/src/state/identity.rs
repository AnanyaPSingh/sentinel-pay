use anchor_lang::prelude::*;

#[account]
pub struct Identity {
    pub wallet: Pubkey,
    pub institution: Pubkey,
    pub entity_name: String,
    pub jurisdiction: String,      // "EU", "IN", "US", etc.
    pub kyc_verified: bool,
    pub kyc_expiry: i64,           // Unix timestamp
    // Risk tier: 0=LOW, 1=MEDIUM, 2=HIGH
    pub risk_tier: u8,
    pub transaction_count: u32,
    pub is_sanctioned: bool,
    pub bump: u8,
}

impl Identity {
    pub const MAX_ENTITY_NAME_LEN: usize = 128;
    pub const MAX_JURISDICTION_LEN: usize = 3;

    pub fn space() -> usize {
        8 + // discriminator
        32 + // wallet
        32 + // institution
        (4 + Self::MAX_ENTITY_NAME_LEN) + // entity_name
        (4 + Self::MAX_JURISDICTION_LEN) + // jurisdiction
        1 + // kyc_verified
        8 + // kyc_expiry
        1 + // risk_tier
        4 + // transaction_count
        1 + // is_sanctioned
        1 // bump
    }
}
