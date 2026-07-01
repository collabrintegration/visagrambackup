import cron from "node-cron";
import { refreshVisaData } from "./refreshVisaData";
import { logger } from "./logger";

// In-memory refresh state — survives within a server session
let lastRefreshedAt: Date | null = null;
let lastRefreshSource: string | null = null;
let refreshInProgress = false;

export function getRefreshState() {
  return {
    lastRefreshedAt: lastRefreshedAt?.toISOString() ?? null,
    lastRefreshSource,
    refreshInProgress,
  };
}

export async function triggerRefresh(): Promise<{ updated: number; source: string }> {
  if (refreshInProgress) {
    logger.info("Visa refresh already in progress — skipping duplicate trigger");
    return { updated: 0, source: "skipped" };
  }
  refreshInProgress = true;
  try {
    const result = await refreshVisaData();
    lastRefreshedAt = new Date();
    lastRefreshSource = result.source;
    return result;
  } finally {
    refreshInProgress = false;
  }
}

export function startScheduler() {
  // Run immediately on startup (in background — don't block server boot)
  setTimeout(() => {
    triggerRefresh().catch((err) =>
      logger.error({ err }, "Startup visa refresh failed")
    );
  }, 5_000); // 5s delay so server finishes booting first

  // Schedule daily at 02:00 UTC
  cron.schedule("0 2 * * *", () => {
    triggerRefresh().catch((err) =>
      logger.error({ err }, "Scheduled visa refresh failed")
    );
  });

  logger.info("Visa data scheduler started (daily at 02:00 UTC)");
}
