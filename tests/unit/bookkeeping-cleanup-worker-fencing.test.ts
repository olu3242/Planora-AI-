import { describe, expect, it, vi } from "vitest";
import { executeClaimedCleanupJob } from "../../src/lib/accounting/bookkeeping-cleanup-worker";
const job = { id: "job", organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period", leaseToken: "lease" };
describe("cleanup worker completion fencing", () => {
  it("does not attempt a second completion when finalization fails", async () => {
    const finish = vi.fn().mockRejectedValue(new Error("DATABASE_UNAVAILABLE"));
    await expect(executeClaimedCleanupJob(job, {
      scan: vi.fn().mockResolvedValue(undefined), finish,
    })).rejects.toThrow("DATABASE_UNAVAILABLE");
    expect(finish).toHaveBeenCalledTimes(1);
  });
  it("does not retry after lost lease during successful scan finalization", async () => {
    const finish = vi.fn().mockRejectedValue(new Error("CLEANUP_LEASE_LOST"));
    await expect(executeClaimedCleanupJob(job, {
      scan: vi.fn().mockResolvedValue(undefined), finish,
    })).rejects.toThrow("CLEANUP_LEASE_LOST");
    expect(finish).toHaveBeenCalledTimes(1);
  });
});
