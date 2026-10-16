import { describe, expect, it, vi } from "vitest";
import { createMappingApplication } from "../../src/lib/accounting/ai-mapping-application";
import type { MappingDecision } from "../../src/lib/accounting/ai-mapping-engine";
import type { AiMappingRepository } from "../../src/lib/accounting/ai-mapping-repository";

const decision: MappingDecision = {
  tenantId: "org-a", transactionId: "tx-1", sourceHash: "hash",
  accountId: "account-a", confidence: 0.91, explanation: "Evidence",
  evidenceIds: ["e1"], agent: "BOOKKEEPING", route: "AUTO_PREPARE",
  status: "PROPOSED", modelVersion: "v1", policyVersion: "p1", idempotencyKey: "key-1",
};
const principal = { userId: "u1", organizationId: "org-a", roles: ["ACCOUNTANT"] as const };
function fixture() {
  const repository = {
    saveProposalAndWorkItem: vi.fn(async () => ({ proposalKey: "key-1", created: true })),
    recordReview: vi.fn(async () => {}),
    listWorkItems: vi.fn(async () => []),
  } satisfies AiMappingRepository;
  const loadProposal = vi.fn(async () => decision as MappingDecision | null);
  const loadEligibleAccounts = vi.fn(async () => [{ id: "account-a", organizationId: "org-a", active: true }]);
  const hasReview = vi.fn(async () => false);
  return { app: createMappingApplication({ repository, loadProposal, loadEligibleAccounts, hasReview }), repository, loadProposal };
}
describe("mapping application authorization", () => {
  it("denies enqueue across tenants", async () => {
    const { app, repository } = fixture();
    await expect(app.enqueue({ ...principal, organizationId: "org-b" }, decision)).rejects.toThrow("TENANT_MISMATCH");
    expect(repository.saveProposalAndWorkItem).not.toHaveBeenCalled();
  });
  it("uses authenticated organization for queue reads", async () => {
    const { app, repository } = fixture();
    await app.queue(principal);
    expect(repository.listWorkItems).toHaveBeenCalledWith({ authenticatedTenantId: "org-a", assignedRole: "ACCOUNTANT" });
  });
  it("denies review to bookkeeper", async () => {
    const { app, repository } = fixture();
    await expect(app.review({ ...principal, roles: ["BOOKKEEPER"] }, { proposalKey: "key-1", action: "APPROVE", selectedAccountId: null, reason: "ok" })).rejects.toThrow("FORBIDDEN_MAPPING_REVIEW");
    expect(repository.recordReview).not.toHaveBeenCalled();
  });
  it("denies unknown proposal", async () => {
    const f = fixture();
    f.loadProposal.mockResolvedValueOnce(null);
    await expect(f.app.review(principal, { proposalKey: "missing", action: "REJECT", selectedAccountId: null, reason: "No" })).rejects.toThrow("MAPPING_PROPOSAL_NOT_FOUND");
  });
  it("records an authorized review without posting", async () => {
    const { app, repository } = fixture();
    await expect(app.review(principal, { proposalKey: "key-1", action: "APPROVE", selectedAccountId: null, reason: "Verified" })).resolves.toEqual({ proposalKey: "key-1", action: "APPROVE" });
    expect(repository.recordReview).toHaveBeenCalledTimes(1);
  });
  it("denies fabricated account overrides", async () => {
    const { app, repository } = fixture();
    await expect(app.review(principal, { proposalKey: "key-1", action: "OVERRIDE", selectedAccountId: "foreign", reason: "Override" })).rejects.toThrow("MAPPING_ACCOUNT_NOT_ELIGIBLE");
    expect(repository.recordReview).not.toHaveBeenCalled();
  });
});
