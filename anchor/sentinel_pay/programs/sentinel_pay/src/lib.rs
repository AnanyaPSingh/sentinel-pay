use anchor_lang::prelude::*;

pub mod errors;
pub mod state;
pub mod instructions;

// Import everything from each submodule so Anchor's macro
// can find the generated __client_accounts_X types
use instructions::initialize_institution::*;
use instructions::create_policy::*;
use instructions::register_identity::*;
use instructions::create_payment::*;
use instructions::execute_payment::*;
use instructions::release_escrow::*;

declare_id!("FCJT6A8icN4VetnrzH1TTD9Kgi2k8zjCAkDSUzUuzXEY");

#[program]
pub mod sentinel_pay {
    use super::*;

    pub fn initialize_institution(ctx: Context<InitializeInstitution>, name: String, jurisdiction: String) -> Result<()> {
        instructions::initialize_institution::handler(ctx, name, jurisdiction)
    }
    pub fn create_policy(ctx: Context<CreatePolicy>, policy_id: u64, name: String, allowed_jurisdictions: Vec<String>, max_transfer_usd_cents: u64, min_kyt_score: u8, escrow_new_counterparty_threshold: u8) -> Result<()> {
        instructions::create_policy::handler(ctx, policy_id, name, allowed_jurisdictions, max_transfer_usd_cents, min_kyt_score, escrow_new_counterparty_threshold)
    }
    pub fn register_identity(ctx: Context<RegisterIdentity>, entity_name: String, jurisdiction: String, kyc_verified: bool, kyc_expiry: i64, risk_tier: u8) -> Result<()> {
        instructions::register_identity::handler(ctx, entity_name, jurisdiction, kyc_verified, kyc_expiry, risk_tier)
    }
    pub fn create_payment(
    ctx: Context<CreatePayment>,
    payment_id: u64,
    amount_usd_cents: u64,
    source_currency: String,
    target_currency: String,
    fx_rate_bps: u64,
    policy_id: u64,       
    sender_vasp: String,
    receiver_vasp: String,
    reference: String,
) -> Result<()> {
    instructions::create_payment::handler(
        ctx, payment_id, amount_usd_cents, source_currency,
        target_currency, fx_rate_bps, policy_id,  
        sender_vasp, receiver_vasp, reference,
    )
}
    pub fn execute_payment(ctx: Context<ExecutePayment>) -> Result<()> {
        instructions::execute_payment::handler(ctx)
    }
    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        instructions::release_escrow::handler(ctx)
    }
}