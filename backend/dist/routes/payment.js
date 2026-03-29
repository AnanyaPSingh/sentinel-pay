"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = require("express");
const database_1 = require("../db/database");
const kytService_1 = require("../services/kytService");
const policyEvaluator_1 = require("../services/policyEvaluator");
const router = (0, express_1.Router)();
router.post("/:institutionPda/payments", async (req, res) => {
    const { institutionPda } = req.params;
    const { senderWallet, receiverWallet, amountUsdCents, sourceCurrency, targetCurrency, memo, policyId, autonomousMode, } = req.body;
    if (!senderWallet || !receiverWallet || !amountUsdCents || !policyId || !sourceCurrency || !targetCurrency) {
        return res.status(400).json({ error: "Missing required payment fields" });
    }
    try {
        const institution = await (0, database_1.runQuerySingle)("SELECT * FROM institutions WHERE institution_pda = ?", [institutionPda]);
        if (!institution) {
            return res.status(404).json({ error: "Institution not found" });
        }
        const sender = await (0, database_1.runQuerySingle)("SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?", [institutionPda, senderWallet]);
        const receiver = await (0, database_1.runQuerySingle)("SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?", [institutionPda, receiverWallet]);
        if (!sender || !receiver) {
            return res.status(400).json({ error: "Sender or receiver identity missing" });
        }
        const policy = await (0, database_1.runQuerySingle)("SELECT * FROM policies WHERE institution_pda = ? AND policy_id = ?", [institutionPda, Number(policyId)]);
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }
        const policyData = {
            institutionPda,
            policyId: Number(policyId),
            allowedJurisdictions: JSON.parse(policy.allowed_jurisdictions || "[]"),
            maxTransferUsdCents: policy.max_transfer_usd_cents,
            minKytScore: policy.min_kyt_score,
            escrowNewCounterpartyThreshold: policy.escrow_threshold,
            isActive: Boolean(policy.is_active),
        };
        const kyt = (0, kytService_1.evaluateKyt)(senderWallet, receiverWallet, amountUsdCents / 100.0, memo || "", sender.transaction_count, sender.risk_tier, receiver.risk_tier);
        const preflight = (0, policyEvaluator_1.evaluatePolicy)({
            sender: {
                wallet: sender.wallet,
                jurisdiction: sender.jurisdiction,
                kycVerified: Boolean(sender.kyc_verified),
                kycExpiry: sender.kyc_expiry,
                isSanctioned: Boolean(sender.is_sanctioned),
                transactionCount: sender.transaction_count,
            },
            receiver: {
                wallet: receiver.wallet,
                jurisdiction: receiver.jurisdiction,
                kycVerified: Boolean(receiver.kyc_verified),
                kycExpiry: receiver.kyc_expiry,
                isSanctioned: Boolean(receiver.is_sanctioned),
                transactionCount: receiver.transaction_count,
            },
            amountUsdCents,
            sourceCurrency,
            targetCurrency,
            memo: memo || "",
            policy: policyData,
            policyId: Number(policyId),
            institutionPda,
        }, kyt);
        const now = Math.floor(Date.now() / 1000);
        const paymentPda = `payment-${institutionPda}-${crypto_1.default.randomBytes(6).toString("hex")}`;
        let status = "PENDING_EXECUTION";
        if (!preflight.passed) {
            status = "REJECTED";
        }
        else if (preflight.suggestedAction === "ESCROW") {
            status = "IN_ESCROW";
        }
        await (0, database_1.runQueryExec)(`
      INSERT INTO payments (
        payment_pda,
        institution_pda,
        sender_wallet,
        receiver_wallet,
        amount_usd_cents,
        source_currency,
        target_currency,
        fx_rate_bps,
        status,
        policy_id,
        preflight_passed,
        rejection_reason,
        created_at,
        travel_rule_payload,
        autonomous_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            paymentPda,
            institutionPda,
            senderWallet,
            receiverWallet,
            amountUsdCents,
            sourceCurrency,
            targetCurrency,
            0,
            status,
            Number(policyId),
            preflight.passed ? 1 : 0,
            preflight.passed ? null : "Preflight failed",
            now,
            JSON.stringify(preflight.travelRulePayload),
            autonomousMode ? 1 : 0
        ]);
        await (0, database_1.runQueryExec)(`UPDATE institutions SET payment_count = payment_count + 1, updated_at = ? WHERE institution_pda = ?`, [now, institutionPda]);
        await (0, database_1.runQueryExec)(`INSERT INTO audit_logs (payment_id, event_type, actor, details, created_at) VALUES (?, ?, ?, ?, ?)`, [null, "PAYMENT_CREATED", "system", JSON.stringify({ paymentPda, status, preflight: preflight.checks }), now]);
        return res.status(201).json({
            paymentPda,
            policy: policyData,
            kyt,
            preflight,
            status,
        });
    }
    catch (error) {
        console.error("Error creating payment", error);
        return res.status(500).json({ error: "Could not create payment" });
    }
});
router.get("/:institutionPda/payments", async (req, res) => {
    const { institutionPda } = req.params;
    try {
        const payments = await (0, database_1.runQuery)("SELECT * FROM payments WHERE institution_pda = ? ORDER BY created_at DESC", [institutionPda]);
        return res.json(payments);
    }
    catch (error) {
        console.error("Error fetching payments", error);
        return res.status(500).json({ error: "Could not fetch payments" });
    }
});
router.get("/:institutionPda/payments/:paymentPda", async (req, res) => {
    const { institutionPda, paymentPda } = req.params;
    try {
        const payment = await (0, database_1.runQuerySingle)("SELECT * FROM payments WHERE institution_pda = ? AND payment_pda = ?", [institutionPda, paymentPda]);
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        return res.json(payment);
    }
    catch (error) {
        console.error("Error fetching payment", error);
        return res.status(500).json({ error: "Could not fetch payment" });
    }
});
exports.default = router;
//# sourceMappingURL=payment.js.map