use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::state::{Institution, Payment, PaymentStatus};
use crate::errors::SentinelPayError;

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    pub executor: Signer<'info>,

    #[account(
        seeds = [b"institution", institution.authority.as_ref()],
        bump = institution.bump
    )]
    pub institution: Account<'info, Institution>,

    #[account(
        mut,
        constraint = payment.institution == institution.key() @ SentinelPayError::InvalidPaymentStatus
    )]
    pub payment: Account<'info, Payment>,

    #[account(
        mut,
        token::mint = token_mint,
        token::authority = sender,
        token::token_program = token_program
    )]
    pub sender_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_mint,
        token::token_program = token_program
    )]
    pub receiver_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Sender is validated via token account authority constraint above
    pub sender: AccountInfo<'info>,

    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<ExecutePayment>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let now = Clock::get()?.unix_timestamp;

    require!(
        payment.get_status() == Some(PaymentStatus::Pending),
        SentinelPayError::InvalidPaymentStatus
    );
    require!(
        payment.preflight_passed,
        SentinelPayError::InvalidPaymentStatus
    );
    require!(
        ctx.accounts.institution.is_active,
        SentinelPayError::InstitutionInactive
    );

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.receiver_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
        },
    );
    token_interface::transfer_checked(transfer_ctx, payment.amount_usd_cents, ctx.accounts.token_mint.decimals)?;

    payment.set_status(PaymentStatus::Executed);
    payment.executed_at = now;
    msg!("Payment executed: {} -> {}", payment.sender, payment.receiver);

    Ok(())
}