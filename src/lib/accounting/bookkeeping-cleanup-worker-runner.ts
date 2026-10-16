import "server-only";
import { randomUUID } from "node:crypto";
import { claimCleanupScan, finishCleanupScan, listDueCleanupJobs } from "./bookkeeping-cleanup-job-repository";
import { scanReconciliationForCleanup } from "./bookkeeping-reconciliation-scan";
import { executeClaimedCleanupJob } from "./bookkeeping-cleanup-worker";

/** Explicitly invoked by trusted server automation, not by public requests. */
export async function runCleanupWorkerForOrganization(organizationId: string, limit = 20) {
  const due = await listDueCleanupJobs(organizationId, limit);
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  for (const job of due) {
    const leaseToken = randomUUID();
    if (!await claimCleanupScan(organizationId, job.id, leaseToken)) {
      skipped++;
      continue;
    }
    try {
      const result = await executeClaimedCleanupJob({ ...job, leaseToken }, {
        scan: scanReconciliationForCleanup,
        finish: finishCleanupScan,
      });
      if (result.status === "COMPLETED") completed++;
      else failed++;
    } catch {
      failed++;
      // Lost leases are not force-completed by this worker.
    }
  }
  return { scannedJobs: due.length, completed, skipped, failed };
}
