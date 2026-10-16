import { describe, expect, it } from "vitest";
import { createCleanupCase, transitionCleanupCase, type CleanupAction } from "../../src/lib/accounting/bookkeeping-cleanup-workflow";
const scope = { organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period" };
const issue = { key: "unmatched:b1", kind: "UNMATCHED_BANK" as const, severity: "MEDIUM" as const, recordIds: ["b1"], recommendation: "Investigate", requiresApproval: true as const };
const act = (kind: CleanupAction["kind"], expectedRevision: number, actorId: string, actorRole: CleanupAction["actorRole"], proposal?: string): CleanupAction =>
  ({ kind, expectedRevision, actorId, actorRole, evidenceId: `evidence-${expectedRevision}`, proposal });
describe("bookkeeping cleanup approval workflow", () => {
  it("advances through investigation proposal approval queue and independent verification", () => {
    let c = createCleanupCase(scope, issue);
    c = transitionCleanupCase(c, act("INVESTIGATE", 0, "bookkeeper", "BOOKKEEPER"));
    c = transitionCleanupCase(c, act("PROPOSE", 1, "bookkeeper", "BOOKKEEPER", "Investigate bank match"));
    c = transitionCleanupCase(c, act("APPROVE", 2, "controller", "CONTROLLER"));
    c = transitionCleanupCase(c, act("QUEUE_EXECUTION", 3, "controller", "CONTROLLER"));
    c = transitionCleanupCase(c, act("VERIFY", 4, "accountant", "ACCOUNTANT"));
    expect(c.state).toBe("VERIFIED");
    expect(c.history).toHaveLength(5);
    expect(c.evidenceIds).toHaveLength(5);
  });
  it("rejects self approval", () => {
    let c = createCleanupCase(scope, issue);
    c = transitionCleanupCase(c, act("INVESTIGATE", 0, "controller", "CONTROLLER"));
    c = transitionCleanupCase(c, act("PROPOSE", 1, "controller", "CONTROLLER", "Fix"));
    expect(() => transitionCleanupCase(c, act("APPROVE", 2, "controller", "CONTROLLER"))).toThrow("CLEANUP_APPROVAL_DENIED");
  });
  it("rejects stale revision", () => {
    expect(() => transitionCleanupCase(createCleanupCase(scope, issue), act("INVESTIGATE", 1, "b", "BOOKKEEPER"))).toThrow("STALE_CLEANUP_REVISION");
  });
  it("rejects premature execution", () => {
    expect(() => transitionCleanupCase(createCleanupCase(scope, issue), act("QUEUE_EXECUTION", 0, "c", "CONTROLLER"))).toThrow("INVALID_CLEANUP_TRANSITION");
  });
  it("requires independent verification", () => {
    let c = createCleanupCase(scope, issue);
    c = transitionCleanupCase(c, act("INVESTIGATE", 0, "b", "BOOKKEEPER"));
    c = transitionCleanupCase(c, act("PROPOSE", 1, "b", "BOOKKEEPER", "Fix"));
    c = transitionCleanupCase(c, act("APPROVE", 2, "c", "CONTROLLER"));
    c = transitionCleanupCase(c, act("QUEUE_EXECUTION", 3, "c", "CONTROLLER"));
    expect(() => transitionCleanupCase(c, act("VERIFY", 4, "b", "BOOKKEEPER"))).toThrow("CLEANUP_VERIFICATION_DENIED");
  });
});
