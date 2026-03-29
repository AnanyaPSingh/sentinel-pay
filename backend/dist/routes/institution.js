"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    const { name, jurisdiction, authorityWallet, institutionPda } = req.body;
    if (!name || !jurisdiction || !authorityWallet || !institutionPda) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const now = Math.floor(Date.now() / 1000);
    try {
        await (0, database_1.runQueryExec)(`
      INSERT INTO institutions (
        institution_pda,
        authority_wallet,
        name,
        jurisdiction,
        is_active,
        policy_count,
        payment_count,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 1, 0, 0, ?, ?)
    `, [institutionPda, authorityWallet, name, jurisdiction, now, now]);
        return res.status(201).json({ institutionPda, name, jurisdiction, authorityWallet });
    }
    catch (error) {
        console.error("Error inserting institution", error);
        return res.status(500).json({ error: "Could not register institution" });
    }
});
router.get("/:institutionPda", async (req, res) => {
    const institutionPda = req.params.institutionPda;
    try {
        const institution = await (0, database_1.runQuerySingle)("SELECT * FROM institutions WHERE institution_pda = ?", [institutionPda]);
        if (!institution) {
            return res.status(404).json({ error: "Institution not found" });
        }
        return res.json(institution);
    }
    catch (error) {
        console.error("Error fetching institution", error);
        return res.status(500).json({ error: "Could not fetch institution" });
    }
});
exports.default = router;
//# sourceMappingURL=institution.js.map