/** Tenant-scoped automation cycle. Caller must be a trusted service with verified organization identity. */
export type CleanupCycleDependencies = {
  deliver: (organizationId: string, limit: number) => Promise<{ inspected: number; delivered: number }>;
  process: (organizationId: string, limit: number) => Promise<{ scannedJobs: number; completed: number; skipped: number; failed: number }>;
  health: (organizationId: string) => Promise<{ queued: number; running: number; retrying: number; escalated: number; expired: number }>;
};
export async function executeCleanupCycle(
  organizationId: string,
  dependencies: CleanupCycleDependencies,
  limit = 20,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
    throw new Error("INVALID_AUTHENTICATED_ORGANIZATION_ID");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error("INVALID_CLEANUP_LIMIT");
  const delivery = await dependencies.deliver(organizationId, limit);
  const worker = await dependencies.process(organizationId, limit);
  const health = await dependencies.health(organizationId);
  return { delivery, worker, health, status: worker.failed > 0 || health.escalated > 0 ? "ATTENTION" : "ADVISORY_ONLY" as const };
}
