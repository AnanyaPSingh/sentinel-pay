"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    const { paymentId } = req.query;
    const db = (0, database_1.getDatabase)();
    if (paymentId) {
        const rows = db
            .prepare("SELECT * FROM audit_logs WHERE payment_id = ? ORDER BY created_at DESC")
            .all(Number(paymentId));
        return res.json(rows);
    }
    const rows = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200").all();
    return res.json(rows);
});
exports.default = router;
//# sourceMappingURL=audit.js.map