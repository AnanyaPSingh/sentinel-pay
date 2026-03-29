"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.post("/:institutionPda/policies", async (req, res) => {
    const { institutionPda } = req.params;
    const { policyId, name, allowedJurisdictions, maxTransferUsdCents, minKytScore, escrowThreshold, isActive, rulesJson, } = req.body;
    if (policyId === undefined ||
        !name ||
        !Array.isArray(allowedJurisdictions) ||
        maxTransferUsdCents === undefined ||
        minKytScore === undefined ||
        escrowThreshold === undefined) {
        return res.status(400).json({ error: "Missing required policy fields" });
    }
    const now = Math.floor(Date.now() / 1000);
    const policyPda = `policy-${institutionPda}-${policyId}`;
    try {
        await (0, database_1.runQueryExec)(`
      INSERT INTO policies (
        policy_pda,
        institution_pda,
        policy_id,
        name,
        allowed_jurisdictions,
        max_transfer_usd_cents,
        min_kyt_score,
        escrow_threshold,
        is_active,
        rules_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            policyPda,
            institutionPda,
            policyId,
            name,
            JSON.stringify(allowedJurisdictions),
            maxTransferUsdCents,
            minKytScore,
            escrowThreshold,
            isActive ? 1 : 0,
            rulesJson ? JSON.stringify(rulesJson) : JSON.stringify({}),
            now,
            now
        ]);
        await (0, database_1.runQueryExec)(`UPDATE institutions SET policy_count = policy_count + 1, updated_at = ? WHERE institution_pda = ?`, [now, institutionPda]);
        return res.status(201).json({ policyPda, institutionPda, policyId, name });
    }
    catch (error) {
        console.error("Error creating policy", error);
        return res.status(500).json({ error: "Unable to create policy" });
    }
});
router.get("/:institutionPda/policies", async (req, res) => {
    const { institutionPda } = req.params;
    try {
        const policies = await (0, database_1.runQuery)("SELECT * FROM policies WHERE institution_pda = ?", [institutionPda]);
        const formattedPolicies = policies.map((p) => ({
            ...p,
            allowed_jurisdictions: JSON.parse(p.allowed_jurisdictions || "[]")
        }));
        return res.json(formattedPolicies);
    }
    catch (error) {
        console.error("Error fetching policies", error);
        return res.status(500).json({ error: "Could not fetch policies" });
    }
});
router.get("/:institutionPda/policies/:policyId", async (req, res) => {
    const { institutionPda, policyId } = req.params;
    try {
        const policy = await (0, database_1.runQuerySingle)("SELECT * FROM policies WHERE institution_pda = ? AND policy_id = ?", [institutionPda, Number(policyId)]);
        if (!policy) {
            return res.status(404).json({ error: "Policy not found" });
        }
        policy.allowed_jurisdictions = JSON.parse(policy.allowed_jurisdictions || "[]");
        return res.json(policy);
    }
    catch (error) {
        console.error("Error fetching policy", error);
        return res.status(500).json({ error: "Could not fetch policy" });
    }
});
router.patch("/:institutionPda/policies/:policyId", async (req, res) => {
    const { institutionPda, policyId } = req.params;
    const { isActive } = req.body;
    if (isActive === undefined) {
        return res.status(400).json({ error: "isActive field must be provided" });
    }
    const now = Math.floor(Date.now() / 1000);
    try {
        const result = await (0, database_1.runQueryExec)("UPDATE policies SET is_active = ?, updated_at = ? WHERE institution_pda = ? AND policy_id = ?", [isActive ? 1 : 0, now, institutionPda, Number(policyId)]);
        // Note: sqlite3 doesn't return changes count like better-sqlite3, so we can't check if the update affected any rows
        return res.json({ policyId: Number(policyId), isActive });
    }
    catch (error) {
        console.error("Error updating policy", error);
        return res.status(500).json({ error: "Could not update policy" });
    }
});
exports.default = router;
//# sourceMappingURL=policy.js.map