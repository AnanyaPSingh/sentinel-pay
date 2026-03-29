use anchor_lang::prelude::*;

#[account]
pub struct Institution {
    pub authority: Pubkey,         // Admin wallet
    pub name: String,              // e.g. "ACME Corp"
    pub jurisdiction: String,      // e.g. "EU", "IN", "US"
    pub is_active: bool,
    pub policy_count: u32,
    pub payment_count: u64,
    pub bump: u8,
}

impl Institution {
    pub const MAX_NAME_LEN: usize = 64;
    pub const ALLOWED_JURISDICTIONS: &'static [&'static str] =
        &["EU", "US", "UK", "IN", "SG", "CH", "AE"];

    pub fn space() -> usize {
        8 + // discriminator
        32 + // authority
        (4 + Self::MAX_NAME_LEN) + // name
        (4 + 3) + // jurisdiction (e.g. "USA" = 3 chars max)
        1 + // is_active
        4 + // policy_count
        8 + // payment_count
        1 // bump
    }
}
