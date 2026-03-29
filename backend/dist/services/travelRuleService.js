"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPayload = buildPayload;
exports.serializeForChain = serializeForChain;
exports.verifyPayload = verifyPayload;
const crypto_1 = __importDefault(require("crypto"));
function randomLei(seed) {
    return `LEI${crypto_1.default.createHash("sha256").update(seed).digest("hex").slice(0, 16).toUpperCase()}`;
}
function buildPayload(params) {
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
    };
    const signature = crypto_1.default
        .createHash("sha256")
        .update(JSON.stringify({ ...payload, signature: undefined }))
        .digest("hex");
    return { ...payload, signature };
}
function serializeForChain(payload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
}
function verifyPayload(payload) {
    const local = { ...payload, signature: undefined };
    const hashed = crypto_1.default.createHash("sha256").update(JSON.stringify(local)).digest("hex");
    return hashed === payload.signature;
}
//# sourceMappingURL=travelRuleService.js.map