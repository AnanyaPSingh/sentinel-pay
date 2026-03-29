use anchor_lang::prelude::*;

#[account]
pub struct Policy {
    pub institution: Pubkey,
    pub policy_id: u64,
    pub name: String,
    // Jurisdiction whitelist e.g. ["EU", "US", "SG"]
    pub allowed_jurisdictions: Vec<String>,
    // Max transfer in USD cents (e.g. 1_000_000_00 = $1M)
    pub max_transfer_usd_cents: u64,
    // Min KYT score required (0–100, higher = cleaner)
    pub min_kyt_score: u8,
    // Force escrow for new counterparties (< n prior txns)
    pub escrow_new_counterparty_threshold: u8,
    pub is_active: bool,
    pub bump: u8,
}

impl Policy {
    pub const MAX_NAME_LEN: usize = 64;
    pub const MAX_JURISDICTIONS: usize = 10;

    pub fn space() -> usize {
        8 + // discriminator
        32 + // institution
        8 + // policy_id
        (4 + Self::MAX_NAME_LEN) + // name
        (4 + Self::MAX_JURISDICTIONS * 4) + // allowed_jurisdictions (simplified estimate)
        8 + // max_transfer_usd_cents
        1 + // min_kyt_score
        1 + // escrow_new_counterparty_threshold
        1 + // is_active
        1 // bump
    }
}
