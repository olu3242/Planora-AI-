import { describe, expect, it } from "vitest";
import { cleanupReadinessControls } from "../../src/lib/accounting/bookkeeping-cleanup-readiness";
describe("cleanup to financial readiness integration", () => {
  const at = "2026-10-16T00:00:00.000Z";
  it("blocks bookkeeping readiness for unresolved journal cleanup", () => {
    const result = cleanupReadinessControls([{ id: "a", issueKey: "balance:a", state: "APPROVED", evidenceIds: ["e"] }], true, at);
    expect(result.bookkeeping.status).toBe("FAIL");
    expect(result.bookkeeping.evidenceIds).toEqual(["e"]);
  });
  it("blocks reconciliation for unresolved bank cleanup", () => {
    const result = cleanupReadinessControls([{ id: "b", issueKey: "unmatched:b", state: "DETECTED", evidenceIds: [] }], true, at);
    expect(result.reconciliation.status).toBe("FAIL");
  });
  it("never certifies PASS from verified cleanup alone", () => {
    const result = cleanupReadinessControls([{ id: "a", issueKey: "draft:a", state: "VERIFIED", evidenceIds: ["e"] }], true, at);
    expect(result.bookkeeping.status).toBe("UNKNOWN");
    expect(result.reconciliation.status).toBe("UNKNOWN");
  });
  it("never certifies PASS from empty or truncated scans", () => {
    for (const complete of [true, false]) {
      const result = cleanupReadinessControls([], complete, at);
      expect(result.bookkeeping.status).toBe("UNKNOWN");
      expect(result.reconciliation.status).toBe("UNKNOWN");
    }
  });
});
