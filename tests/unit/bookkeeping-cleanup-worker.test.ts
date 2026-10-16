import { describe, expect, it, vi } from "vitest";
import { executeClaimedCleanupJob } from "../../src/lib/accounting/bookkeeping-cleanup-worker";
const job = { id: "j", organizationId: "o", legalEntityId: "e", fiscalPeriodId: "p", leaseToken: "token" };
describe("advisory bookkeeping worker", () => {
  it("completes only after scan succeeds", async () => {
    const scan = vi.fn().mockResolvedValue({ issueCount: 1 });
    const finish = vi.fn().mockResolvedValue(undefined);
    expect(await executeClaimedCleanupJob(job, { scan, finish })).toEqual({ status: "COMPLETED" });
    expect(finish).toHaveBeenCalledWith("o", "j", "token");
  });
  it("reports failure through fenced completion", async () => {
    const scan = vi.fn().mockRejectedValue(new Error("TRANSIENT"));
    const finish = vi.fn().mockResolvedValue(undefined);
    expect(await executeClaimedCleanupJob(job, { scan, finish })).toEqual({ status: "RETRY_SCHEDULED", errorCode: "TRANSIENT" });
    expect(finish).toHaveBeenCalledWith("o", "j", "token", "TRANSIENT");
  });
  it("never retries finalization after lease loss", async () => {
    const finish = vi.fn();
    await expect(executeClaimedCleanupJob(job, {
      scan: vi.fn().mockRejectedValue(new Error("CLEANUP_LEASE_LOST")), finish,
    })).rejects.toThrow("CLEANUP_LEASE_LOST");
    expect(finish).not.toHaveBeenCalled();
  });
  it("rejects incomplete job context", async () => {
    await expect(executeClaimedCleanupJob({ ...job, organizationId: "" }, {
      scan: vi.fn(), finish: vi.fn(),
    })).rejects.toThrow("INVALID_CLEANUP_JOB");
  });
});
