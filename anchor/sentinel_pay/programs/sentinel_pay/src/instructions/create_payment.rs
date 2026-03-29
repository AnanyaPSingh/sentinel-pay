use anchor_lang::prelude::*;
use crate::state::{Institution, Policy, Identity, Payment, PaymentStatus};
use crate::errors::SentinelPayError;

#[derive(Accounts)]
#[instruction(
    payment_id: u64,
    amount_usd_cents: u64,
    source_currency: String,
    target_currency: String,
    fx_rate_bps: u64,
    policy_id: u64
)]
pub struct CreatePayment<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        seeds = [b"institution", institution.authority.as_ref()],
        bump = institution.bump,
        constraint = institution.is_active @ SentinelPayError::InstitutionInactive
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        seeds = [b"identity", institution.key().as_ref(), sender.key().as_ref()],
        bump = sender_identity.bump
    )]
    pub sender_identity: Account<'info, Identity>,

    #[account(
        seeds = [b"identity", institution.key().as_ref(), receiver.key().as_ref()],
        bump = receiver_identity.bump
    )]
    pub receiver_identity: Account<'info, Identity>,

    #[account(
        seeds = [b"policy", institution.key().as_ref(), &policy_id.to_le_bytes()],
        bump = policy.bump,
        constraint = policy.is_active @ SentinelPayError::PolicyInactive
    )]
    pub policy: Account<'info, Policy>,

    #[account(
        init,
        payer = sender,
        space = Payment::space(),
        seeds = [b"payment", institution.key().as_ref(), &payment_id.to_le_bytes()],
        bump
    )]
    pub payment: Account<'info, Payment>,
    
    /// CHECK: Receiver is a raw account, validated via identity PDA seeds above
    pub receiver: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
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
    let payment = &mut ctx.accounts.payment;
    let now = Clock::get()?.unix_timestamp;

    // Initialize payment fields
    payment.payment_id = payment_id;
    payment.institution = ctx.accounts.institution.key();
    payment.sender = ctx.accounts.sender.key();
    payment.receiver = ctx.accounts.receiver.key();
    payment.amount_usd_cents = amount_usd_cents;
    payment.source_currency = source_currency;
    payment.target_currency = target_currency;
    payment.fx_rate_bps = fx_rate_bps;
    payment.policy_id = policy_id;
    payment.sender_vasp = sender_vasp;
    payment.receiver_vasp = receiver_vasp;
    payment.reference = reference;
    payment.created_at = now;
    payment.executed_at = 0;
    payment.bump = ctx.bumps.payment;

    // Run all pre-flight checks
    let mut rejection_reason = String::new();
    let mut preflight_passed = true;

    // Check 1: Sender KYC verified
    if !ctx.accounts.sender_identity.kyc_verified {
        rejection_reason.push_str("Sender KYC not verified. ");
        preflight_passed = false;
    }

    // Check 2: Sender KYC not expired
    if ctx.accounts.sender_identity.kyc_expiry <= now {
        rejection_reason.push_str("Sender KYC expired. ");
        preflight_passed = false;
    }

    // Check 3: Receiver KYC verified
    if !ctx.accounts.receiver_identity.kyc_verified {
        rejection_reason.push_str("Receiver KYC not verified. ");
        preflight_passed = false;
    }

    // Check 4: Receiver KYC not expired
    if ctx.accounts.receiver_identity.kyc_expiry <= now {
        rejection_reason.push_str("Receiver KYC expired. ");
        preflight_passed = false;
    }

    // Check 5: Neither party is sanctioned
    if ctx.accounts.sender_identity.is_sanctioned {
        rejection_reason.push_str("Sender is sanctioned. ");
        preflight_passed = false;
    }
    if ctx.accounts.receiver_identity.is_sanctioned {
        rejection_reason.push_str("Receiver is sanctioned. ");
        preflight_passed = false;
    }

    // Check 6: Amount within policy limit
    if amount_usd_cents > ctx.accounts.policy.max_transfer_usd_cents {
        rejection_reason.push_str("Amount exceeds policy limit. ");
        preflight_passed = false;
    }

    // Check 7: Receiver jurisdiction allowed
    if !ctx
        .accounts
        .policy
        .allowed_jurisdictions
        .contains(&ctx.accounts.receiver_identity.jurisdiction)
    {
        rejection_reason.push_str("Receiver jurisdiction not allowed. ");
        preflight_passed = false;
    }

    // Determine payment status
    if !preflight_passed {
        payment.set_status(PaymentStatus::Rejected);
        payment.preflight_passed = false;
        payment.rejection_reason = rejection_reason;
        msg!("Payment rejected: {}", payment.rejection_reason);
    } else {
        // Check if receiver is a new counterparty (requires escrow)
        if ctx.accounts.receiver_identity.transaction_count
            < ctx.accounts.policy.escrow_new_counterparty_threshold as u32
        {
            payment.set_status(PaymentStatus::InEscrow);
            msg!("Payment routed to escrow (new counterparty)");
        } else {
            payment.set_status(PaymentStatus::Pending);
            msg!("Payment preflight passed, status: Pending");
        }
        payment.preflight_passed = true;
        payment.rejection_reason = String::new();
    }

    Ok(())
}
