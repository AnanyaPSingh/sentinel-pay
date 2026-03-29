import { Router, Request, Response } from "express";
import { runQuery, runQuerySingle, runQueryExec } from "../db/database";

const router = Router();

router.get("/compliance-issues", async (req: Request, res: Response) => {
  try {
    const issues = await runQuery(
      "SELECT * FROM payments WHERE status IN ('REJECTED', 'IN_ESCROW') ORDER BY created_at DESC"
    );
    return res.json(issues);
  } catch (error) {
    console.error("Error fetching compliance issues", error);
    return res.status(500).json({ error: "Could not fetch compliance issues" });
  }
});

router.get("/manual-review", async (req: Request, res: Response) => {
  try {
    const results = await runQuery(
      "SELECT * FROM payments WHERE status = 'PENDING_EXECUTION' AND preflight_passed = 1 AND autonomous_mode = 0 ORDER BY created_at DESC"
    );
    return res.json(results);
  } catch (error) {
    console.error("Error fetching manual review items", error);
    return res.status(500).json({ error: "Could not fetch manual review items" });
  }
});

router.post("/review/:paymentPda", async (req: Request, res: Response) => {
  const { paymentPda } = req.params;
  const { action } = req.body;
  if (!action || !["APPROVE", "REJECT", "ESCROW"].includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  try {
    const payment = await runQuerySingle("SELECT * FROM payments WHERE payment_pda = ?", [paymentPda]);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    let newStatus = payment.status;
    if (action === "APPROVE") newStatus = "PENDING_EXECUTION";
    if (action === "ESCROW") newStatus = "IN_ESCROW";
    if (action === "REJECT") newStatus = "REJECTED";

    await runQueryExec("UPDATE payments SET status = ? WHERE payment_pda = ?", [newStatus, paymentPda]);
    await runQueryExec(
      "INSERT INTO audit_logs (payment_id, event_type, actor, details, created_at) VALUES (?, ?, ?, ?, ?)",
      [
        payment.id,
        "REGULATOR_REVIEW",
        "regulator",
        JSON.stringify({ action, statusBefore: payment.status, statusAfter: newStatus }),
        Math.floor(Date.now() / 1000)
      ]
    );

    return res.json({ paymentPda, status: newStatus });
  } catch (error) {
    console.error("Error processing regulator review", error);
    return res.status(500).json({ error: "Could not process review" });
  }
});

export default router;
