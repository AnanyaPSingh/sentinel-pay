import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { initDatabase } from "./db/database";
import institutionRouter from "./routes/institution";
import identityRouter from "./routes/identity";
import policyRouter from "./routes/policy";
import paymentRouter from "./routes/payment";
import auditRouter from "./routes/audit";
import regulatorRouter from "./routes/regulator";
import eventRouter from "./routes/events";
import { startAutonomousExecutor } from "./services/autonomousExecutor";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/api/health", (req: Request, res: Response) => {
  return res.json({ status: "ok", timestamp: Date.now() });
});

// routes
app.use("/api/institution", institutionRouter);
app.use("/api", identityRouter);
app.use("/api", policyRouter);
app.use("/api", paymentRouter);
app.use("/api/audit", auditRouter);
app.use("/api/regulator", regulatorRouter);
app.use("/api/events", eventRouter);

const port = Number(process.env.PORT || 3001);

(async () => {
  try {
    initDatabase(process.env.DB_PATH || "./sentinel.db");
    startAutonomousExecutor();

    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize backend", error);
    process.exit(1);
  }
})();
