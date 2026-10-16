/** Advisory queue-health evaluation, without external notification side effects. */
export type CleanupQueueHealth = Readonly<{
  queued: number; running: number; retrying: number; escalated: number; expired: number;
}>;
export type CleanupQueueAlert = Readonly<{
  code: "ESCALATED_JOBS" | "EXPIRED_LEASES" | "BACKLOG";
  severity: "WARNING" | "CRITICAL";
  count: number;
}>;
export function evaluateCleanupQueueHealth(
  health: CleanupQueueHealth,
  backlogThreshold = 100,
): CleanupQueueAlert[] {
  if (!Number.isSafeInteger(backlogThreshold) || backlogThreshold < 1 ||
      Object.values(health).some(n => !Number.isSafeInteger(n) || n < 0)) {
    throw new Error("INVALID_CLEANUP_QUEUE_HEALTH");
  }
  const alerts: CleanupQueueAlert[] = [];
  if (health.escalated > 0) alerts.push({ code: "ESCALATED_JOBS", severity: "CRITICAL", count: health.escalated });
  if (health.expired > 0) alerts.push({ code: "EXPIRED_LEASES", severity: "CRITICAL", count: health.expired });
  if (health.queued + health.retrying >= backlogThreshold) {
    alerts.push({ code: "BACKLOG", severity: "WARNING", count: health.queued + health.retrying });
  }
  return alerts;
}
