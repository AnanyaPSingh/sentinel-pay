use anchor_lang::prelude::*;
use crate::state::{Institution, Policy};
use crate::errors::SentinelPayError;

#[derive(Accounts)]
#[instruction(policy_id: u64, name: String, allowed_jurisdictions: Vec<String>)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"institution", authority.key().as_ref()],
        bump = institution.bump,
        constraint = institution.authority == authority.key() @ SentinelPayError::UnauthorizedExecutor
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        init,
        payer = authority,
        space = Policy::space(),
        seeds = [b"policy", institution.key().as_ref(), &policy_id.to_le_bytes()],
        bump
    )]
    pub policy: Account<'info, Policy>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreatePolicy>,
    policy_id: u64,
    name: String,
    allowed_jurisdictions: Vec<String>,
    max_transfer_usd_cents: u64,
    min_kyt_score: u8,
    escrow_new_counterparty_threshold: u8,
) -> Result<()> {
    // Validate inputs
    require!(
        max_transfer_usd_cents > 0,
        SentinelPayError::ExceedsMaxTransfer
    );
    require!(
        min_kyt_score <= 100,
        SentinelPayError::KytScoreTooLow
    );
    require!(
        name.len() <= Policy::MAX_NAME_LEN,
        SentinelPayError::NameTooLong
    );

    // Validate all jurisdictions are allowed
    for jurisdiction in &allowed_jurisdictions {
        require!(
            Institution::ALLOWED_JURISDICTIONS.contains(&jurisdiction.as_str()),
            SentinelPayError::InvalidJurisdiction
        );
    }

    let policy = &mut ctx.accounts.policy;
    policy.institution = ctx.accounts.institution.key();
    policy.policy_id = policy_id;
    policy.name = name;
    policy.allowed_jurisdictions = allowed_jurisdictions;
    policy.max_transfer_usd_cents = max_transfer_usd_cents;
    policy.min_kyt_score = min_kyt_score;
    policy.escrow_new_counterparty_threshold = escrow_new_counterparty_threshold;
    policy.is_active = true;
    policy.bump = ctx.bumps.policy;

    // Increment institution policy count
    ctx.accounts.institution.policy_count = ctx
        .accounts
        .institution
        .policy_count
        .checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    msg!("Policy created: {}", policy.name);
    Ok(())
}
