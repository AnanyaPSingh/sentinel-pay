use anchor_lang::prelude::*;
use crate::state::Institution;
use crate::errors::SentinelPayError;

#[derive(Accounts)]
#[instruction(name: String, jurisdiction: String)]
pub struct InitializeInstitution<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Institution::space(),
        seeds = [b"institution", authority.key().as_ref()],
        bump
    )]
    pub institution: Account<'info, Institution>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeInstitution>,
    name: String,
    jurisdiction: String,
) -> Result<()> {
    // Validate name length
    require!(
        name.len() <= Institution::MAX_NAME_LEN,
        SentinelPayError::NameTooLong
    );

    // Validate jurisdiction
    require!(
        Institution::ALLOWED_JURISDICTIONS.contains(&jurisdiction.as_str()),
        SentinelPayError::InvalidJurisdiction
    );

    let institution = &mut ctx.accounts.institution;
    institution.authority = ctx.accounts.authority.key();
    institution.name = name;
    institution.jurisdiction = jurisdiction;
    institution.is_active = true;
    institution.policy_count = 0;
    institution.payment_count = 0;
    institution.bump = ctx.bumps.institution;

    msg!("Institution initialized: {}", institution.name);
    Ok(())
}
