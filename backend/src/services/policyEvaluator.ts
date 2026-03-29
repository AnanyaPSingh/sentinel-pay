import { TravelRulePayload, buildPayload } from "./travelRuleService";
import { KytResult } from "./kytService";

export type PreflightCheck = {
  name: string;
  passed: boolean;
  reason?: string;
};

export type PreflightResult = {
  passed: boolean;
  checks: PreflightCheck[];
  requiresEscrow: boolean;
  suggestedAction: "EXECUTE" | "ESCROW" | "MANUAL" | "BLOCK";
  kytScore: number;
  travelRulePayload: TravelRulePayload;
};

export interface Policy {
  institutionPda: string;
  policyId: number;
  allowedJurisdictions: string[];
  maxTransferUsdCents: number;
  minKytScore: number;
  escrowNewCounterpartyThreshold: number;
  isActive: boolean;
}

export interface Identity {
  wallet: string;
  jurisdiction: string;
  kycVerified: boolean;
  kycExpiry: number;
  isSanctioned: boolean;
  transactionCount: number;
}

export interface PaymentRequest {
  sender: Identity;
  receiver: Identity;
  amountUsdCents: number;
  sourceCurrency: string;
  targetCurrency: string;
  memo: string;
  policy: Policy;
  policyId: number;
  institutionPda: string;
}

export function evaluatePolicy(
  req: PaymentRequest,
  kyt: KytResult
): PreflightResult {
  const now = Math.floor(Date.now() / 1000);
  const checks: PreflightCheck[] = [];

  checks.push({
    name: "Sender KYC Verified",
    passed: req.sender.kycVerified,
    reason: req.sender.kycVerified ? undefined : "Sender KYC not verified",
  });

  checks.push({
    name: "Sender KYC Not Expired",
    passed: req.sender.kycExpiry > now,
    reason: req.sender.kycExpiry > now ? undefined : "Sender KYC expired",
  });

  checks.push({
    name: "Receiver KYC Verified",
    passed: req.receiver.kycVerified,
    reason: req.receiver.kycVerified ? undefined : "Receiver KYC not verified",
  });

  checks.push({
    name: "Receiver KYC Not Expired",
    passed: req.receiver.kycExpiry > now,
    reason: req.receiver.kycExpiry > now ? undefined : "Receiver KYC expired",
  });

  checks.push({
    name: "Sender/Receiver not sanctioned",
    passed: !req.sender.isSanctioned && !req.receiver.isSanctioned,
    reason: req.sender.isSanctioned || req.receiver.isSanctioned ? "Sanctioned entity involved" : undefined,
  });

  checks.push({
    name: "Amount within policy limit",
    passed: req.amountUsdCents <= req.policy.maxTransferUsdCents,
    reason: req.amountUsdCents <= req.policy.maxTransferUsdCents ? undefined : "Exceeds max transfer limit",
  });

  checks.push({
    name: "Receiver jurisdiction allowed",
    passed: req.policy.allowedJurisdictions.includes(req.receiver.jurisdiction),
    reason: req.policy.allowedJurisdictions.includes(req.receiver.jurisdiction) ? undefined : "Receiver jurisdiction not allowed",
  });

  checks.push({
    name: "Policy is active",
    passed: req.policy.isActive,
    reason: req.policy.isActive ? undefined : "Policy is inactive",
  });

  const allPassed = checks.every((c) => c.passed) && kyt.recommendation !== "BLOCK";

  const requiresEscrow = req.receiver.transactionCount < req.policy.escrowNewCounterpartyThreshold || kyt.recommendation === "ALLOW_WITH_ESCROW";

  let suggestedAction: PreflightResult["suggestedAction"] = "EXECUTE";
  if (!allPassed) suggestedAction = "BLOCK";
  else if (requiresEscrow) suggestedAction = "ESCROW";
  else if (kyt.recommendation === "MANUAL_REVIEW") suggestedAction = "MANUAL";

  const travelRulePayload = buildPayload({
    transactionId: `${req.institutionPda}-${req.policyId}-${Date.now()}`,
    originatingVaspName: "Origin VASP",
    originatingVaspJurisdiction: req.sender.jurisdiction,
    beneficiaryVaspName: "Beneficiary VASP",
    beneficiaryVaspJurisdiction: req.receiver.jurisdiction,
    originatorName: "Sender Identity",
    originatorWallet: req.sender.wallet,
    beneficiaryName: "Receiver Identity",
    beneficiaryWallet: req.receiver.wallet,
    transferAmount: req.amountUsdCents / 100.0,
    currency: req.targetCurrency,
  });

  return {
    passed: allPassed,
    checks,
    requiresEscrow,
    suggestedAction,
    kytScore: kyt.score,
    travelRulePayload,
  };
}
