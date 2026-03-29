use anchor_lang::prelude::*;

#[error_code]
pub enum SentinelPayError {
    #[msg("KYC verification required")]
    KycNotVerified,

    #[msg("KYC has expired")]
    KycExpired,

    #[msg("Entity is sanctioned")]
    SanctionedEntity,

    #[msg("Transfer amount exceeds policy limit")]
    ExceedsMaxTransfer,

    #[msg("Jurisdiction not allowed by policy")]
    JurisdictionNotAllowed,

    #[msg("Policy is inactive")]
    PolicyInactive,

    #[msg("Institution is inactive")]
    InstitutionInactive,

    #[msg("Invalid payment status for this operation")]
    InvalidPaymentStatus,

    #[msg("Unauthorized executor")]
    UnauthorizedExecutor,

    #[msg("Invalid jurisdiction")]
    InvalidJurisdiction,

    #[msg("Name exceeds maximum length")]
    NameTooLong,

    #[msg("KYT score too low")]
    KytScoreTooLow,
}
