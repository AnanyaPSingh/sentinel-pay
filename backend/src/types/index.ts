export type PaymentStatus =
  | "PENDING_EXECUTION"
  | "IN_ESCROW"
  | "EXECUTED"
  | "REJECTED"
  | "RELEASED";

export interface InstitutionRow {
  id?: number;
  institutionPda: string;
  authorityWallet: string;
  name: string;
  jurisdiction: string;
  isActive: boolean;
  policyCount: number;
  paymentCount: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface IdentityRow {
  id?: number;
  wallet: string;
  institutionPda: string;
  entityName: string;
  jurisdiction: string;
  kycVerified: boolean;
  kycExpiry: number;
  riskTier: number;
  transactionCount: number;
  isSanctioned: boolean;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PolicyRow {
  id?: number;
  policyPda: string;
  institutionPda: string;
  policyId: number;
  name: string;
  allowedJurisdictions: string[];
  maxTransferUsdCents: number;
  minKytScore: number;
  escrowThreshold: number;
  isActive: boolean;
  rulesJson?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface PaymentRow {
  id?: number;
  paymentPda: string;
  institutionPda: string;
  senderWallet: string;
  receiverWallet: string;
  amountUsdCents: number;
  sourceCurrency: string;
  targetCurrency: string;
  fxRateBps: number;
  status: PaymentStatus;
  policyId: number;
  senderVasp?: string;
  receiverVasp?: string;
  reference?: string;
  preflightPassed: boolean;
  rejectionReason?: string;
  createdAt: number;
  executedAt?: number;
  travelRulePayload?: Record<string, unknown>;
  autonomousMode: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id?: number;
  paymentId?: number;
  eventType: string;
  actor?: string;
  details?: string;
  createdAt: number;
}
