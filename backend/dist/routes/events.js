"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.post("/track", async (req, res) => {
    const { eventType, paymentPda, actor, details } = req.body;
    if (!eventType || !paymentPda) {
        return res.status(400).json({ error: "Missing eventType or paymentPda" });
    }
    try {
        const payment = await (0, database_1.runQuerySingle)("SELECT id FROM payments WHERE payment_pda = ?", [paymentPda]);
        const now = Math.floor(Date.now() / 1000);
        await (0, database_1.runQueryExec)("INSERT INTO audit_logs (payment_id, event_type, actor, details, created_at) VALUES (?, ?, ?, ?, ?)", [payment?.id || null, eventType, actor || "unknown", details ? JSON.stringify(details) : "", now]);
        return res.status(201).json({ status: "tracked", paymentPda, eventType });
    }
    catch (error) {
        console.error("Error tracking event", error);
        return res.status(500).json({ error: "Could not track event" });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map