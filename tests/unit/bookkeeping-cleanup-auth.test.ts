import { describe, expect, it } from "vitest";
import { cleanupRoleForSession, parseUserCleanupAction } from "../../src/lib/accounting/bookkeeping-cleanup-auth";
describe("authenticated cleanup boundary", () => {
  it("maps real organization roles without trusting client role", () => {
    expect(cleanupRoleForSession("CFO")).toBe("CONTROLLER");
    expect(cleanupRoleForSession("ANALYST")).toBe("BOOKKEEPER");
    expect(cleanupRoleForSession("FPA_DIRECTOR")).toBe("ACCOUNTANT");
  });
  it("denies platform administrators", () => {
    expect(() => cleanupRoleForSession("PLATFORM_ADMIN")).toThrow("FORBIDDEN_CLEANUP");
  });
  it("allows only human review actions", () => {
    expect(parseUserCleanupAction({ kind: "PROPOSE", expectedRevision: 1, evidenceId: "e", proposal: "Investigate" }).kind).toBe("PROPOSE");
    for (const kind of ["QUEUE_EXECUTION", "VERIFY", "POST", "DELETE"]) {
      expect(() => parseUserCleanupAction({ kind, expectedRevision: 1, evidenceId: "e" })).toThrow("INVALID_CLEANUP_ACTION");
    }
  });
  it("rejects invalid revision and evidence", () => {
    expect(() => parseUserCleanupAction({ kind: "APPROVE", expectedRevision: -1, evidenceId: "e" })).toThrow("INVALID_CLEANUP_ACTION");
    expect(() => parseUserCleanupAction({ kind: "APPROVE", expectedRevision: 0, evidenceId: "" })).toThrow("INVALID_CLEANUP_ACTION");
  });
});
