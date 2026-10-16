import { describe, expect, it, vi } from "vitest";
import { runWithCleanupFence } from "../../src/lib/accounting/bookkeeping-cleanup-fencing";
describe("cleanup side effect fencing", () => {
  it("checks lease before and after operation", async () => {
    const order: string[] = [];
    const check = vi.fn(async () => { order.push("check"); });
    const operation = vi.fn(async () => { order.push("operation"); return 42; });
    expect(await runWithCleanupFence(check, operation)).toBe(42);
    expect(order).toEqual(["check", "operation", "check"]);
  });
  it("prevents work when lease check fails", async () => {
    const operation = vi.fn();
    await expect(runWithCleanupFence(async () => { throw new Error("CLEANUP_LEASE_LOST"); }, operation)).rejects.toThrow("CLEANUP_LEASE_LOST");
    expect(operation).not.toHaveBeenCalled();
  });
  it("propagates post-operation lease loss", async () => {
    const check = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("CLEANUP_LEASE_LOST"));
    await expect(runWithCleanupFence(check, async () => true)).rejects.toThrow("CLEANUP_LEASE_LOST");
  });
});
