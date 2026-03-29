"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveRiskTier = deriveRiskTier;
exports.runKyc = runKyc;
exports.isKycValid = isKycValid;
const crypto_1 = __importDefault(require("crypto"));
function deriveRiskTier(wallet) {
    const hash = crypto_1.default.createHash("sha256").update(wallet).digest("hex");
    const v = parseInt(hash.slice(0, 8), 16) % 100;
    if (v < 65)
        return 0;
    if (v < 90)
        return 1;
    return 2;
}
function runKyc(wallet) {
    const normalized = wallet.toLowerCase();
    const hash = crypto_1.default.createHash("sha256").update(normalized).digest("hex");
    const v = parseInt(hash.slice(0, 8), 16) % 100;
    let kycLevel;
    if (v < 70)
        kycLevel = "VERIFIED";
    else if (v < 90)
        kycLevel = "PENDING";
    else
        kycLevel = "REJECTED";
    const jurisdictionCandidates = ["US", "EU", "IN", "UK", "SG", "CH", "AE"];
    const jIdx = parseInt(hash.slice(8, 10), 16) % jurisdictionCandidates.length;
    const jurisdiction = jurisdictionCandidates[jIdx];
    const entityName = `Entity-${hash.slice(0, 8)}`;
    const expiryDate = kycLevel === "VERIFIED"
        ? Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
        : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    const riskTier = deriveRiskTier(wallet);
    return {
        entityName,
        jurisdiction,
        kycLevel,
        expiryDate,
        riskTier,
    };
}
function isKycValid(kycResult) {
    const now = Math.floor(Date.now() / 1000);
    if (kycResult.kycLevel !== "VERIFIED")
        return false;
    if (kycResult.expiryDate <= now)
        return false;
    return true;
}
//# sourceMappingURL=kycService.js.map