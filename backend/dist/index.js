"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = require("./db/database");
const institution_1 = __importDefault(require("./routes/institution"));
const identity_1 = __importDefault(require("./routes/identity"));
const policy_1 = __importDefault(require("./routes/policy"));
const payment_1 = __importDefault(require("./routes/payment"));
const audit_1 = __importDefault(require("./routes/audit"));
const regulator_1 = __importDefault(require("./routes/regulator"));
const events_1 = __importDefault(require("./routes/events"));
const autonomousExecutor_1 = require("./services/autonomousExecutor");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// health
app.get("/api/health", (req, res) => {
    return res.json({ status: "ok", timestamp: Date.now() });
});
// routes
app.use("/api/institution", institution_1.default);
app.use("/api", identity_1.default);
app.use("/api", policy_1.default);
app.use("/api", payment_1.default);
app.use("/api/audit", audit_1.default);
app.use("/api/regulator", regulator_1.default);
app.use("/api/events", events_1.default);
const port = Number(process.env.PORT || 3001);
(async () => {
    try {
        (0, database_1.initDatabase)(process.env.DB_PATH || "./sentinel.db");
        (0, autonomousExecutor_1.startAutonomousExecutor)();
        app.listen(port, () => {
            console.log(`Backend listening on http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error("Failed to initialize backend", error);
        process.exit(1);
    }
})();
//# sourceMappingURL=index.js.map