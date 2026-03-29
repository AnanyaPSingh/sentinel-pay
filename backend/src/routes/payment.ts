import * as crypto from "crypto";
import { Router, Request, Response } from "express";
import { runQuerySingle, runQuery, runQueryExec } from "../db/database";
import { evaluateKyt } from "../services/kytService";
import { evaluatePolicy } from "../services/policyEvaluator";
import { startAutonomousExecutor } from "../services/autonomousExecutor";

const router = Router();

router.post("/:institutionPda/payments", async (req: Request, res: Response) => {
  const { institutionPda } = req.params;
  const {
    senderWallet,
    receiverWallet,
    amountUsdCents,
    sourceCurrency,
    targetCurrency,
    memo,
    policyId,
    autonomousMode,
  } = req.body;

  if (!senderWallet || !receiverWallet || !amountUsdCents || !policyId || !sourceCurrency || !targetCurrency) {
    return res.status(400).json({ error: "Missing required payment fields" });
  }

  try {
    const institution = await runQuerySingle("SELECT * FROM institutions WHERE institution_pda = ?", [institutionPda]);

    if (!institution) {
      return res.status(404).json({ error: "Institution not found" });
    }

    const sender = await runQuerySingle(
      "SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?",
      [institutionPda, senderWallet]
    ) as any;
    const receiver = await runQuerySingle(
      "SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?",
      [institutionPda, receiverWallet]
    ) as any;

    if (!sender || !receiver) {
      return res.status(400).json({ error: "Sender or receiver identity missing" });
    }

    const policy = await runQuerySingle(
      "SELECT * FROM policies WHERE institution_pda = ? AND policy_id = ?",
      [institutionPda, Number(policyId)]
    ) as any;

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

    const kyt = evaluateKyt(
      senderWallet,
      receiverWallet,
      amountUsdCents / 100.0,
      memo || "",
      sender.transaction_count,
      sender.risk_tier,
      receiver.risk_tier
    );

    const preflight = evaluatePolicy(
      {
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
      },
      kyt
    );

    const now = Math.floor(Date.now() / 1000);
    const paymentPda = `payment-${institutionPda}-${crypto.randomBytes(6).toString("hex")}`;

    let status: "PENDING_EXECUTION" | "IN_ESCROW" | "REJECTED" = "PENDING_EXECUTION";
    if (!preflight.passed) {
      status = "REJECTED";
    } else if (preflight.suggestedAction === "ESCROW") {
      status = "IN_ESCROW";
    }

    await runQueryExec(`
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

    await runQueryExec(
      `UPDATE institutions SET payment_count = payment_count + 1, updated_at = ? WHERE institution_pda = ?`,
      [now, institutionPda]
    );

    await runQueryExec(
      `INSERT INTO audit_logs (payment_id, event_type, actor, details, created_at) VALUES (?, ?, ?, ?, ?)`,
      [null, "PAYMENT_CREATED", "system", JSON.stringify({ paymentPda, status, preflight: preflight.checks }), now]
    );

    return res.status(201).json({
      paymentPda,
      policy: policyData,
      kyt,
      preflight,
      status,
    });
  } catch (error) {
    console.error("Error creating payment", error);
    return res.status(500).json({ error: "Could not create payment" });
  }
});

router.get("/:institutionPda/payments", async (req: Request, res: Response) => {
  const { institutionPda } = req.params;

  try {
    const payments = await runQuery(
      "SELECT * FROM payments WHERE institution_pda = ? ORDER BY created_at DESC",
      [institutionPda]
    );
    return res.json(payments);
  } catch (error) {
    console.error("Error fetching payments", error);
    return res.status(500).json({ error: "Could not fetch payments" });
  }
});

router.get("/:institutionPda/payments/:paymentPda", async (req: Request, res: Response) => {
  const { institutionPda, paymentPda } = req.params;

  try {
    const payment = await runQuerySingle(
      "SELECT * FROM payments WHERE institution_pda = ? AND payment_pda = ?",
      [institutionPda, paymentPda]
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.json(payment);
  } catch (error) {
    console.error("Error fetching payment", error);
    return res.status(500).json({ error: "Could not fetch payment" });
  }
});

export default router;
