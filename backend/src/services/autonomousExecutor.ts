import { runQuery } from "../db/database";

const MAX_EXECUTIONS_PER_MINUTE = 10;
const POLL_MS = 30_000;

let executionsThisMinute = 0;
let lastReset = Date.now();

function resetRateLimiter() {
  const now = Date.now();
  if (now - lastReset >= 60_000) {
    executionsThisMinute = 0;
    lastReset = now;
  }
}

function incrementExecution() {
  executionsThisMinute += 1;
}

export async function startAutonomousExecutor() {
  setInterval(async () => {
    try {
      resetRateLimiter();

      if (executionsThisMinute >= MAX_EXECUTIONS_PER_MINUTE) {
        return;
      }

      const pendingPayments = await runQuery(
        "SELECT * FROM payments WHERE status = 'PENDING_EXECUTION' AND autonomous_mode = 1 LIMIT 25"
      );

      for (const payment of pendingPayments) {
        if (executionsThisMinute >= MAX_EXECUTIONS_PER_MINUTE) break;

        console.log("[autonomous] would execute payment", payment.payment_pda);

        incrementExecution();
      }
    } catch (error) {
      console.error("Autonomous executor loop error", error);
    }
  }, POLL_MS);
}
