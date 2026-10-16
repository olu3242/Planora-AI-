import { describe, expect, it, vi } from "vitest";
import { executeCleanupCycle } from "../../src/lib/accounting/bookkeeping-cleanup-cycle";
const org = "11111111-1111-4111-8111-111111111111";
function deps() {
  return {
    deliver: vi.fn().mockResolvedValue({ inspected: 2, delivered: 2 }),
    process: vi.fn().mockResolvedValue({ scannedJobs: 2, completed: 2, skipped: 0, failed: 0 }),
    health: vi.fn().mockResolvedValue({ queued: 0, running: 0, retrying: 0, escalated: 0, expired: 0 }),
  };
}
describe("trusted bookkeeping cleanup cycle", () => {
  it("delivers before processing and reading health", async () => {
    const calls: string[] = [];
    const d = deps();
    d.deliver.mockImplementation(async () => { calls.push("deliver"); return { inspected: 1, delivered: 1 }; });
    d.process.mockImplementation(async () => { calls.push("process"); return { scannedJobs: 1, completed: 1, skipped: 0, failed: 0 }; });
    d.health.mockImplementation(async () => { calls.push("health"); return { queued: 0, running: 0, retrying: 0, escalated: 0, expired: 0 }; });
    expect((await executeCleanupCycle(org, d)).status).toBe("ADVISORY_ONLY");
    expect(calls).toEqual(["deliver", "process", "health"]);
  });
  it("does not process if delivery fails", async () => {
    const d = deps();
    d.deliver.mockRejectedValue(new Error("DB_UNAVAILABLE"));
    await expect(executeCleanupCycle(org, d)).rejects.toThrow("DB_UNAVAILABLE");
    expect(d.process).not.toHaveBeenCalled();
  });
  it("marks failed processing as attention", async () => {
    const d = deps();
    d.process.mockResolvedValue({ scannedJobs: 1, completed: 0, skipped: 0, failed: 1 });
    expect((await executeCleanupCycle(org, d)).status).toBe("ATTENTION");
  });
  it("rejects unverified organization IDs", async () => {
    await expect(executeCleanupCycle("invalid", deps())).rejects.toThrow("INVALID_AUTHENTICATED_ORGANIZATION_ID");
  });
});
