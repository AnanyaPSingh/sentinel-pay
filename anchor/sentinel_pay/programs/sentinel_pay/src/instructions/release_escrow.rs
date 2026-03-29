use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::state::{Institution, Payment, PaymentStatus};
use crate::errors::SentinelPayError;

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"institution", authority.key().as_ref()],
        bump = institution.bump,
        constraint = institution.authority == authority.key() @ SentinelPayError::UnauthorizedExecutor
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
        token::token_program = token_program
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_mint,
        token::token_program = token_program
    )]
    pub receiver_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<ReleaseEscrow>) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let now = Clock::get()?.unix_timestamp;

    require!(
        payment.get_status() == Some(PaymentStatus::InEscrow),
        SentinelPayError::InvalidPaymentStatus
    );

    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        TransferChecked {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.receiver_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            mint: ctx.accounts.token_mint.to_account_info(),
        },
    );
    token_interface::transfer_checked(transfer_ctx, payment.amount_usd_cents, ctx.accounts.token_mint.decimals)?;

    payment.set_status(PaymentStatus::Released);
    payment.executed_at = now;
    msg!("Escrow released for payment: {}", payment.payment_id);

    Ok(())
}