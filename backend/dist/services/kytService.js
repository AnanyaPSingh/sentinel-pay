"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateKyt = evaluateKyt;
const FLAGGED_KEYWORDS = ["mixer", "unknown", "cash", "anonymous"];
function evaluateKyt(senderWallet, receiverWallet, amountUsd, memo, senderTransactionCount, senderRiskTier, receiverRiskTier) {
    let score = 80;
    const flags = [];
    if (amountUsd > 500000) {
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
    let recommendation;
    if (score >= 80)
        recommendation = "ALLOW";
    else if (score >= 60)
        recommendation = "ALLOW_WITH_ESCROW";
    else if (score >= 40)
        recommendation = "MANUAL_REVIEW";
    else
        recommendation = "BLOCK";
    return { score, flags, recommendation };
}
//# sourceMappingURL=kytService.js.map