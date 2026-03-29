import { Router, Request, Response } from "express";
import { getDatabase } from "../db/database";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { paymentId } = req.query;
  const db = getDatabase();

  if (paymentId) {
    const rows = db
      .prepare("SELECT * FROM audit_logs WHERE payment_id = ? ORDER BY created_at DESC")
      .all(Number(paymentId));
    return res.json(rows);
  }

  const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200").all();
  return res.json(rows);
});

export default router;
