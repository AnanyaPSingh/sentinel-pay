use anchor_lang::prelude::*;
use crate::state::{Institution, Identity};
use crate::errors::SentinelPayError;

#[derive(Accounts)]
pub struct RegisterIdentity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"institution", authority.key().as_ref()],
        bump = institution.bump,
        constraint = institution.authority == authority.key() @ SentinelPayError::UnauthorizedExecutor
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        init,
        payer = authority,
        space = Identity::space(),
        seeds = [b"identity", institution.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,

    /// CHECK: Wallet is used only as a PDA seed and stored as a pubkey, no ownership checks needed
    pub wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterIdentity>,
    entity_name: String,
    jurisdiction: String,
    kyc_verified: bool,
    kyc_expiry: i64,
    risk_tier: u8,
) -> Result<()> {
    // Validate jurisdiction
    require!(
        Institution::ALLOWED_JURISDICTIONS.contains(&jurisdiction.as_str()),
        SentinelPayError::InvalidJurisdiction
    );

    // Validate KYC expiry is in the future
    let now = Clock::get()?.unix_timestamp;
    require!(
        kyc_expiry > now,
        SentinelPayError::KycExpired
    );

    // Validate risk tier (0, 1, or 2)
    require!(
        risk_tier <= 2,
        SentinelPayError::InvalidPaymentStatus
    );

    let identity = &mut ctx.accounts.identity;
    identity.wallet = ctx.accounts.wallet.key();
    identity.institution = ctx.accounts.institution.key();
    identity.entity_name = entity_name;
    identity.jurisdiction = jurisdiction;
    identity.kyc_verified = kyc_verified;
    identity.kyc_expiry = kyc_expiry;
    identity.risk_tier = risk_tier;
    identity.transaction_count = 0;
    identity.is_sanctioned = false;
    identity.bump = ctx.bumps.identity;

    msg!("Identity registered for wallet: {}", identity.wallet);
    Ok(())
}
