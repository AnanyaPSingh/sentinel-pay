use anchor_lang::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)]
pub enum PaymentStatus {
    Pending = 0,
    InEscrow = 1,
    Executed = 2,
    Rejected = 3,
    Released = 4,
}

impl PaymentStatus {
    pub fn to_u8(&self) -> u8 {
        *self as u8
    }

    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0 => Some(Self::Pending),
            1 => Some(Self::InEscrow),
            2 => Some(Self::Executed),
            3 => Some(Self::Rejected),
            4 => Some(Self::Released),
            _ => None,
        }
    }
}

#[account]
pub struct Payment {
    pub payment_id: u64,
    pub institution: Pubkey,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount_usd_cents: u64,
    pub source_currency: String,    // "INR", "USD", "EUR"
    pub target_currency: String,
    pub fx_rate_bps: u64,           // FX rate * 10000
    pub status: u8,                 // Stored as u8, mapped from PaymentStatus
    pub policy_id: u64,
    // Travel Rule fields
    pub sender_vasp: String,
    pub receiver_vasp: String,
    pub reference: String,          // Invoice ID / memo
    // Pre-flight result
    pub preflight_passed: bool,
    pub rejection_reason: String,
    pub created_at: i64,
    pub executed_at: i64,
    pub bump: u8,
}

impl Payment {
    pub const MAX_CURRENCY_LEN: usize = 4;
    pub const MAX_VASP_LEN: usize = 128;
    pub const MAX_REFERENCE_LEN: usize = 128;
    pub const MAX_REJECTION_REASON_LEN: usize = 256;

    pub fn space() -> usize {
        8 + // discriminator
        8 + // payment_id
        32 + // institution
        32 + // sender
        32 + // receiver
        8 + // amount_usd_cents
        (4 + Self::MAX_CURRENCY_LEN) + // source_currency
        (4 + Self::MAX_CURRENCY_LEN) + // target_currency
        8 + // fx_rate_bps
        1 + // status
        8 + // policy_id
        (4 + Self::MAX_VASP_LEN) + // sender_vasp
        (4 + Self::MAX_VASP_LEN) + // receiver_vasp
        (4 + Self::MAX_REFERENCE_LEN) + // reference
        1 + // preflight_passed
        (4 + Self::MAX_REJECTION_REASON_LEN) + // rejection_reason
        8 + // created_at
        8 + // executed_at
        1 // bump
    }

    pub fn get_status(&self) -> Option<PaymentStatus> {
        PaymentStatus::from_u8(self.status)
    }

    pub fn set_status(&mut self, status: PaymentStatus) {
        self.status = status.to_u8();
    }
}
