import { Router, Request, Response } from "express";
import { runQuerySingle, runQuery, runQueryExec } from "../db/database";
import { runKyc, isKycValid } from "../services/kycService";

const router = Router();

router.post("/:institutionPda/identities", async (req: Request, res: Response) => {
  const { institutionPda } = req.params;
  const { wallet } = req.body;

  if (!wallet) {
    return res.status(400).json({ error: "Missing wallet" });
  }

  try {
    const existing = await runQuerySingle(
      "SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?",
      [institutionPda, wallet]
    );

    const kycResult = runKyc(wallet);
    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      await runQueryExec(`
        UPDATE identities SET
          entity_name = ?,
          jurisdiction = ?,
          kyc_verified = ?,
          kyc_expiry = ?,
          risk_tier = ?,
          updated_at = ?
        WHERE institution_pda = ? AND wallet = ?
      `, [
        kycResult.entityName,
        kycResult.jurisdiction,
        isKycValid(kycResult) ? 1 : 0,
        kycResult.expiryDate,
        kycResult.riskTier,
        now,
        institutionPda,
        wallet
      ]);

      return res.json({ ...existing, ...kycResult, kycVerified: isKycValid(kycResult) });
    }

    await runQueryExec(`
      INSERT INTO identities (
        wallet,
        institution_pda,
        entity_name,
        jurisdiction,
        kyc_verified,
        kyc_expiry,
        risk_tier,
        transaction_count,
        is_sanctioned,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `, [
      wallet,
      institutionPda,
      kycResult.entityName,
      kycResult.jurisdiction,
      isKycValid(kycResult) ? 1 : 0,
      kycResult.expiryDate,
      kycResult.riskTier,
      now,
      now
    ]);

    return res.status(201).json({
      wallet,
      institutionPda,
      ...kycResult,
      kycVerified: isKycValid(kycResult),
    });
  } catch (error) {
    console.error("Error creating/updating identity", error);
    return res.status(500).json({ error: "Could not create/update identity" });
  }
});

router.get("/:institutionPda/identities/:wallet", async (req: Request, res: Response) => {
  const { institutionPda, wallet } = req.params;

  try {
    const identity = await runQuerySingle(
      "SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?",
      [institutionPda, wallet]
    );

    if (!identity) {
      return res.status(404).json({ error: "Identity not found" });
    }

    return res.json(identity);
  } catch (error) {
    console.error("Error fetching identity", error);
    return res.status(500).json({ error: "Could not fetch identity" });
  }
});

router.get("/:institutionPda/identities", async (req: Request, res: Response) => {
  const { institutionPda } = req.params;

  try {
    const identities = await runQuery(
      "SELECT * FROM identities WHERE institution_pda = ?",
      [institutionPda]
    );
    return res.json(identities);
  } catch (error) {
    console.error("Error fetching identities", error);
    return res.status(500).json({ error: "Could not fetch identities" });
  }
});

export default router;
