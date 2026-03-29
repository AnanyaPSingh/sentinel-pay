"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const kycService_1 = require("../services/kycService");
const router = (0, express_1.Router)();
router.post("/:institutionPda/identities", async (req, res) => {
    const { institutionPda } = req.params;
    const { wallet } = req.body;
    if (!wallet) {
        return res.status(400).json({ error: "Missing wallet" });
    }
    try {
        const existing = await (0, database_1.runQuerySingle)("SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?", [institutionPda, wallet]);
        const kycResult = (0, kycService_1.runKyc)(wallet);
        const now = Math.floor(Date.now() / 1000);
        if (existing) {
            await (0, database_1.runQueryExec)(`
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
                (0, kycService_1.isKycValid)(kycResult) ? 1 : 0,
                kycResult.expiryDate,
                kycResult.riskTier,
                now,
                institutionPda,
                wallet
            ]);
            return res.json({ ...existing, ...kycResult, kycVerified: (0, kycService_1.isKycValid)(kycResult) });
        }
        await (0, database_1.runQueryExec)(`
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
            (0, kycService_1.isKycValid)(kycResult) ? 1 : 0,
            kycResult.expiryDate,
            kycResult.riskTier,
            now,
            now
        ]);
        return res.status(201).json({
            wallet,
            institutionPda,
            ...kycResult,
            kycVerified: (0, kycService_1.isKycValid)(kycResult),
        });
    }
    catch (error) {
        console.error("Error creating/updating identity", error);
        return res.status(500).json({ error: "Could not create/update identity" });
    }
});
router.get("/:institutionPda/identities/:wallet", async (req, res) => {
    const { institutionPda, wallet } = req.params;
    try {
        const identity = await (0, database_1.runQuerySingle)("SELECT * FROM identities WHERE institution_pda = ? AND wallet = ?", [institutionPda, wallet]);
        if (!identity) {
            return res.status(404).json({ error: "Identity not found" });
        }
        return res.json(identity);
    }
    catch (error) {
        console.error("Error fetching identity", error);
        return res.status(500).json({ error: "Could not fetch identity" });
    }
});
router.get("/:institutionPda/identities", async (req, res) => {
    const { institutionPda } = req.params;
    try {
        const identities = await (0, database_1.runQuery)("SELECT * FROM identities WHERE institution_pda = ?", [institutionPda]);
        return res.json(identities);
    }
    catch (error) {
        console.error("Error fetching identities", error);
        return res.status(500).json({ error: "Could not fetch identities" });
    }
});
exports.default = router;
//# sourceMappingURL=identity.js.map