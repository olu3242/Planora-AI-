import { describe, expect, it, vi } from "vitest";
import { withCleanupLeaseHeartbeat } from "../../src/lib/accounting/bookkeeping-cleanup-heartbeat";
describe("cleanup lease heartbeat", () => {
  it("renews before and after work", async () => {
    const renew = vi.fn().mockResolvedValue(true);
    const work = vi.fn().mockResolvedValue("ok");
    expect(await withCleanupLeaseHeartbeat(renew, work)).toBe("ok");
    expect(renew).toHaveBeenCalledTimes(2);
  });
  it("refuses work if the initial lease is lost", async () => {
    const work = vi.fn();
    await expect(withCleanupLeaseHeartbeat(vi.fn().mockRejectedValue(new Error("CLEANUP_LEASE_LOST")), work)).rejects.toThrow("CLEANUP_LEASE_LOST");
    expect(work).not.toHaveBeenCalled();
  });
  it("rejects unsafe heartbeat intervals", async () => {
    await expect(withCleanupLeaseHeartbeat(async () => {}, async () => {}, 0)).rejects.toThrow("INVALID_CLEANUP_HEARTBEAT_INTERVAL");
  });
  it("propagates final renewal failures", async () => {
    const renew = vi.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error("CLEANUP_LEASE_LOST"));
    await expect(withCleanupLeaseHeartbeat(renew, async () => "ok")).rejects.toThrow("CLEANUP_LEASE_LOST");
  });
});
