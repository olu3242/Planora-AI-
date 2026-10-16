/** Advisory cleanup worker; posting corrections is outside this boundary. */
export type ClaimedCleanupJob = Readonly<{
  id: string; organizationId: string; legalEntityId: string; fiscalPeriodId: string; leaseToken: string;
}>;
export type CleanupWorkerDependencies = Readonly<{
  scan: (scope: { organizationId: string; legalEntityId: string; fiscalPeriodId: string }) => Promise<unknown>;
  finish: (organizationId: string, jobId: string, token: string, errorCode?: string) => Promise<unknown>;
}>;
export async function executeClaimedCleanupJob(
  job: ClaimedCleanupJob, deps: CleanupWorkerDependencies,
): Promise<{ status: "COMPLETED" | "RETRY_SCHEDULED"; errorCode?: string }> {
  if (!job.id || !job.organizationId || !job.legalEntityId || !job.fiscalPeriodId || !job.leaseToken) {
    throw new Error("INVALID_CLEANUP_JOB");
  }
  let scanError: unknown;
  try {
    await deps.scan({
      organizationId: job.organizationId,
      legalEntityId: job.legalEntityId,
      fiscalPeriodId: job.fiscalPeriodId,
    });
  } catch (error) {
    scanError = error;
  }
  if (scanError !== undefined) {
    const errorCode = scanError instanceof Error ? scanError.message : "CLEANUP_WORKER_FAILED";
    if (errorCode === "CLEANUP_LEASE_LOST") throw scanError;
    await deps.finish(job.organizationId, job.id, job.leaseToken, errorCode);
    return { status: "RETRY_SCHEDULED", errorCode };
  }
  // Never reinterpret a failed completion as a scan failure and finalize twice.
  await deps.finish(job.organizationId, job.id, job.leaseToken);
  return { status: "COMPLETED" };
}
