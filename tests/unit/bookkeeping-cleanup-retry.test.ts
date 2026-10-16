import { describe, expect, it } from "vitest";
import { cleanupRetryDelay, cleanupNextAction } from "../../src/lib/accounting/bookkeeping-cleanup-retry";
describe("bookkeeping cleanup retry policy", () => {
  it("uses bounded exponential delay", () => {
    expect(cleanupRetryDelay(1)).toBe(1000);
    expect(cleanupRetryDelay(2)).toBe(2000);
    expect(cleanupRetryDelay(100)).toBeLessThanOrEqual(3600000);
  });
  it("escalates incomplete scans", () => {
    expect(cleanupNextAction(1, "CLEANUP_SCAN_INCOMPLETE")).toBe("ESCALATE");
  });
  it("escalates at attempt limit", () => {
    expect(cleanupNextAction(5, "TEMPORARY")).toBe("ESCALATE");
  });
  it("retries transient failures before limit", () => {
    expect(cleanupNextAction(2, "TEMPORARY")).toBe("RETRY");
  });
  it("rejects invalid attempt", () => {
    expect(() => cleanupRetryDelay(0)).toThrow("INVALID_ATTEMPT");
  });
});
