import { describe, expect, it } from "vitest";
import { assertAccountingApproval, type AccountingApprovalEvidence } from "../../src/lib/accounting/approval-policy";

const context = {
  organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period",
  sourceKey: "invoice-1", actorId: "preparer",
};
const approved: AccountingApprovalEvidence = {
  id: "approval-1", organizationId: "org", legalEntityId: "entity",
  fiscalPeriodId: "period", sourceKey: "invoice-1",
  preparedById: "preparer", approvedById: "reviewer",
  decision: "APPROVED", expiresAt: new Date("2099-01-01"), consumedAt: null,
};
describe("accounting approval policy", () => {
  it("accepts independently approved matching evidence", () => {
    expect(() => assertAccountingApproval(approved, context)).not.toThrow();
  });
  it("denies missing and rejected approvals", () => {
    expect(() => assertAccountingApproval(null, context)).toThrow("APPROVAL_REQUIRED");
    expect(() => assertAccountingApproval({ ...approved, decision: "REJECTED" }, context)).toThrow("APPROVAL_REQUIRED");
  });
  it("denies cross-tenant and altered transaction scope", () => {
    for (const change of [
      { organizationId: "other" }, { legalEntityId: "other" },
      { fiscalPeriodId: "other" }, { sourceKey: "other" }, { preparedById: "other" },
    ]) expect(() => assertAccountingApproval({ ...approved, ...change }, context)).toThrow("APPROVAL_SCOPE_MISMATCH");
  });
  it("denies self approval, expired evidence and reuse", () => {
    expect(() => assertAccountingApproval({ ...approved, approvedById: "preparer" }, context)).toThrow("SELF_APPROVAL_DENIED");
    expect(() => assertAccountingApproval({ ...approved, expiresAt: new Date("2020-01-01") }, context)).toThrow("APPROVAL_EXPIRED");
    expect(() => assertAccountingApproval({ ...approved, consumedAt: new Date() }, context)).toThrow("APPROVAL_ALREADY_CONSUMED");
  });
});
