import "server-only";
import { deliverCleanupImportOutbox } from "./bookkeeping-cleanup-outbox";
import { runCleanupWorkerForOrganization } from "./bookkeeping-cleanup-worker-runner";
import { cleanupJobHealth } from "./bookkeeping-cleanup-job-repository";
import { executeCleanupCycle } from "./bookkeeping-cleanup-cycle";
import { evaluateCleanupQueueHealth } from "./bookkeeping-cleanup-alert-policy";

/** No public route. Must be called by an authenticated internal scheduler. */
export async function runTrustedBookkeepingCleanupCycle(organizationId: string, limit = 20) {
  const result = await executeCleanupCycle(organizationId, {
    deliver: deliverCleanupImportOutbox,
    process: runCleanupWorkerForOrganization,
    health: cleanupJobHealth,
  }, limit);
  return { ...result, alerts: evaluateCleanupQueueHealth(result.health) };
}
