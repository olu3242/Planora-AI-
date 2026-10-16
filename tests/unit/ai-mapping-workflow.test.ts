import { describe, expect, it } from "vitest";
import type { MappingDecision } from "../../src/lib/accounting/ai-mapping-engine";
import { reviewMapping } from "../../src/lib/accounting/ai-mapping-review";
import { routeMapping } from "../../src/lib/accounting/ai-mapping-routing";
import { proposeReportingClassification } from "../../src/lib/accounting/ai-mapping-reporting";
import { assertMappingTenant } from "../../src/lib/accounting/ai-mapping-repository";

const proposal: MappingDecision = {
  tenantId: "t1", transactionId: "tx1", sourceHash: "hash", accountId: "a1",
  confidence: 0.92, explanation: "Vendor match", evidenceIds: ["doc1"],
  agent: "BOOKKEEPING", route: "AUTO_PREPARE", status: "PROPOSED",
  modelVersion: "v1", policyVersion: "p1", idempotencyKey: "t1:tx1:hash:p1:v1",
};
const reviewer = {
  authenticatedTenantId: "t1", reviewerId: "u1", reviewerCanReview: true,
  allowedAccountIds: ["a1", "a2"], previouslyReviewed: false,
};
describe("mapping review and orchestration boundary", () => {
  it("routes high confidence to validation rather than posting", () => {
    expect(routeMapping(proposal).state).toBe("READY_FOR_VALIDATION");
  });
  it("routes exceptions to accountant", () => {
    expect(routeMapping({ ...proposal, route: "EXCEPTION" })).toMatchObject({ state: "BLOCKED_EXCEPTION", assignedRole: "ACCOUNTANT" });
  });
  it("prevents cross-tenant review", () => {
    expect(() => reviewMapping(proposal, "APPROVE", "a1", "Reviewed", { ...reviewer, authenticatedTenantId: "t2" })).toThrow("TENANT_MISMATCH");
  });
  it("prevents unauthorized review", () => {
    expect(() => reviewMapping(proposal, "APPROVE", "a1", "Reviewed", { ...reviewer, reviewerCanReview: false })).toThrow("FORBIDDEN_MAPPING_REVIEW");
  });
  it("prevents approving an exception without override", () => {
    expect(() => reviewMapping({ ...proposal, route: "EXCEPTION" }, "APPROVE", "a1", "Reviewed", reviewer)).toThrow("MAPPING_EXCEPTION_REQUIRES_OVERRIDE");
  });
  it("rejects fabricated override accounts", () => {
    expect(() => reviewMapping(proposal, "OVERRIDE", "foreign", "Reviewed", reviewer)).toThrow("MAPPING_ACCOUNT_NOT_ELIGIBLE");
  });
  it("records valid human override as evidence only", () => {
    expect(reviewMapping(proposal, "OVERRIDE", "a2", "Corrected", reviewer)).toMatchObject({ selectedAccountId: "a2", action: "OVERRIDE" });
  });
  it("blocks repeat review", () => {
    expect(() => reviewMapping(proposal, "APPROVE", "a1", "Reviewed", { ...reviewer, previouslyReviewed: true })).toThrow("MAPPING_ALREADY_REVIEWED");
  });
  it("fails closed on incomplete reporting map", () => {
    expect(() => proposeReportingClassification(proposal, [{ id: "a1", tenantId: "t1", active: true, statementClass: "PROFIT_AND_LOSS", reportingLineId: null }])).toThrow("REPORTING_MAPPING_MISSING");
  });
  it("produces an unposted reporting proposal", () => {
    expect(proposeReportingClassification(proposal, [{ id: "a1", tenantId: "t1", active: true, statementClass: "PROFIT_AND_LOSS", reportingLineId: "software" }])).toMatchObject({ status: "PROPOSED", reportingLineId: "software" });
  });
  it("requires trusted tenant", () => {
    expect(() => assertMappingTenant("t1", "")).toThrow("TENANT_MISMATCH");
  });
});
