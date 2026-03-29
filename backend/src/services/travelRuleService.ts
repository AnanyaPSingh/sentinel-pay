import crypto from "crypto";

export interface TravelRulePayload {
  transactionId: string;
  originatingVasp: { name: string; lei: string; jurisdiction: string };
  beneficiaryVasp: { name: string; lei: string; jurisdiction: string };
  originator: { name: string; walletAddress: string; accountNumber: string };
  beneficiary: { name: string; walletAddress: string; accountNumber: string };
  transferAmount: number;
  currency: string;
  timestamp: string;
  signature: string;
}

function randomLei(seed: string) {
  return `LEI${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16).toUpperCase()}`;
}

export function buildPayload(params: {
  transactionId: string;
  originatingVaspName: string;
  originatingVaspJurisdiction: string;
  beneficiaryVaspName: string;
  beneficiaryVaspJurisdiction: string;
  originatorName: string;
  originatorWallet: string;
  beneficiaryName: string;
  beneficiaryWallet: string;
  transferAmount: number;
  currency: string;
}) {
  const timestamp = new Date().toISOString();
  const payload = {
    transactionId: params.transactionId,
    originatingVasp: {
      name: params.originatingVaspName,
      lei: randomLei(params.originatingVaspName),
      jurisdiction: params.originatingVaspJurisdiction,
    },
    beneficiaryVasp: {
      name: params.beneficiaryVaspName,
      lei: randomLei(params.beneficiaryVaspName),
      jurisdiction: params.beneficiaryVaspJurisdiction,
    },
    originator: {
      name: params.originatorName,
      walletAddress: params.originatorWallet,
      accountNumber: `ACCT-${params.originatorWallet.slice(0, 10)}`,
    },
    beneficiary: {
      name: params.beneficiaryName,
      walletAddress: params.beneficiaryWallet,
      accountNumber: `ACCT-${params.beneficiaryWallet.slice(0, 10)}`,
    },
    transferAmount: params.transferAmount,
    currency: params.currency,
    timestamp,
    signature: "",
  } as Omit<TravelRulePayload, "signature"> & { signature: string };
  const signature = crypto
    .createHash("sha256")
    .update(JSON.stringify({ ...payload, signature: undefined }))
    .digest("hex");

  return { ...payload, signature };
}

export function serializeForChain(payload: TravelRulePayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyPayload(payload: TravelRulePayload): boolean {
  const local = { ...payload, signature: undefined };
  const hashed = crypto.createHash("sha256").update(JSON.stringify(local)).digest("hex");
  return hashed === payload.signature;
}
