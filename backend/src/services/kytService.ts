interface KytResult {
  score: number;
  flags: string[];
  recommendation: "ALLOW" | "ALLOW_WITH_ESCROW" | "MANUAL_REVIEW" | "BLOCK";
}

const FLAGGED_KEYWORDS = ["mixer", "unknown", "cash", "anonymous"];

export function evaluateKyt(
  senderWallet: string,
  receiverWallet: string,
  amountUsd: number,
  memo: string,
  senderTransactionCount: number,
  senderRiskTier: number,
  receiverRiskTier: number
): KytResult {
  let score = 80;
  const flags: string[] = [];

  if (amountUsd > 500_000) {
    score -= 30;
    flags.push("Amount > 500k");
  }

  if (senderTransactionCount < 3) {
    score -= 20;
    flags.push("Low transaction history");
  }

  const lowerMemo = memo.toLowerCase();
  FLAGGED_KEYWORDS.forEach((kw) => {
    if (lowerMemo.includes(kw)) {
      score -= 25;
      flags.push(`Flagged keyword: ${kw}`);
    }
  });

  if (senderRiskTier !== receiverRiskTier) {
    score -= 15;
    flags.push("Risk tiers differ");
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation: KytResult["recommendation"];
  if (score >= 80) recommendation = "ALLOW";
  else if (score >= 60) recommendation = "ALLOW_WITH_ESCROW";
  else if (score >= 40) recommendation = "MANUAL_REVIEW";
  else recommendation = "BLOCK";

  return { score, flags, recommendation };
}

export type { KytResult };
