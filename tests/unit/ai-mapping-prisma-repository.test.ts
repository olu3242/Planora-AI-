import { describe, expect, it, vi } from "vitest";
import type { MappingDecision } from "../../src/lib/accounting/ai-mapping-engine";
import { routeMapping } from "../../src/lib/accounting/ai-mapping-routing";
import { PrismaAiMappingRepository, type MappingPrismaClient } from "../../src/lib/accounting/ai-mapping-prisma-repository";

const decision: MappingDecision = {
  tenantId: "tenant-a", transactionId: "tx-1", sourceHash: "hash",
  accountId: "a1", confidence: 0.95, explanation: "Evidence",
  evidenceIds: ["doc-1"], agent: "BOOKKEEPING", route: "AUTO_PREPARE",
  status: "PROPOSED", modelVersion: "m1", policyVersion: "p1",
  idempotencyKey: "tenant-a:tx-1:hash:p1:m1",
};
function fixture() {
  let present = false;
  let reviewCount = 0;
  const tx = {
    aiTransactionMappingProposal: {
      findFirst: vi.fn(async () => present ? { id: "proposal-1" } : null),
      upsert: vi.fn(async () => { present = true; return { id: "proposal-1", organizationId: "tenant-a" }; }),
    },
    aiTransactionMappingWorkItem: { upsert: vi.fn(async () => ({})) },
    aiTransactionMappingReview: { create: vi.fn(async () => { if (++reviewCount > 1) throw new Error("UNIQUE_CONSTRAINT"); return {}; }) },
  };
  const db = {
    $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>): Promise<T> => fn(tx),
    aiTransactionMappingWorkItem: { findMany: vi.fn(async () => []) },
  };
  return { repository: new PrismaAiMappingRepository(db as unknown as MappingPrismaClient), tx };
}
describe("mapping persistence adapter contract", () => {
  it("persists proposal and work item atomically via transaction", async () => {
    const { repository, tx } = fixture();
    expect(await repository.saveProposalAndWorkItem({
      decision, workItem: routeMapping(decision), authenticatedTenantId: "tenant-a",
    })).toEqual({ proposalKey: decision.idempotencyKey, created: true });
    expect(tx.aiTransactionMappingWorkItem.upsert).toHaveBeenCalledTimes(1);
  });
  it("treats replay as existing proposal", async () => {
    const { repository } = fixture();
    const input = { decision, workItem: routeMapping(decision), authenticatedTenantId: "tenant-a" };
    await repository.saveProposalAndWorkItem(input);
    expect((await repository.saveProposalAndWorkItem(input)).created).toBe(false);
  });
  it("rejects cross-tenant writes before database access", async () => {
    const { repository, tx } = fixture();
    await expect(repository.saveProposalAndWorkItem({
      decision, workItem: routeMapping(decision), authenticatedTenantId: "tenant-b",
    })).rejects.toThrow("TENANT_MISMATCH");
    expect(tx.aiTransactionMappingProposal.upsert).not.toHaveBeenCalled();
  });
  it("rejects forged work item keys", async () => {
    const { repository } = fixture();
    await expect(repository.saveProposalAndWorkItem({
      decision, workItem: { ...routeMapping(decision), key: "forged" }, authenticatedTenantId: "tenant-a",
    })).rejects.toThrow("MAPPING_WORK_ITEM_MISMATCH");
  });
  it("refuses reviews of absent proposals", async () => {
    const { repository } = fixture();
    await expect(repository.recordReview({
      review: { tenantId: "tenant-a", transactionId: "tx-1", reviewerId: "u1", action: "REJECT", selectedAccountId: null, reason: "No evidence", proposalKey: decision.idempotencyKey },
      authenticatedTenantId: "tenant-a",
    })).rejects.toThrow("MAPPING_PROPOSAL_NOT_FOUND");
  });
});
