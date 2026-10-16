import type { MappingDecision } from "./ai-mapping-engine";
import type { MappingWorkItem } from "./ai-mapping-routing";
import type { MappingReview } from "./ai-mapping-review";
import { assertMappingTenant, type AiMappingRepository } from "./ai-mapping-repository";

/** Database client is injected so the caller can provide the existing authenticated Prisma client.
 * The authenticated tenant must be resolved from the server session, never request body.
 * These methods require a DB role with appropriately scoped access; RLS defaults deny.
 */
export interface MappingPrismaClient {
  $transaction<T>(fn: (tx: MappingPrismaTables) => Promise<T>): Promise<T>;
  aiTransactionMappingWorkItem: {
    findMany(args: { where: { organizationId: string; assignedRole: string }; include: { proposal: true } }): Promise<Array<{
      proposal: { idempotencyKey: string; transactionId: string; organizationId: string };
      assignedRole: string; state: string; priority: string; reason: string;
    }>>;
  };
}
export interface MappingPrismaTables {
  aiTransactionMappingProposal: {
    upsert(args: {
      where: { organizationId_idempotencyKey: { organizationId: string; idempotencyKey: string } };
      create: Record<string, unknown>;
      update: Record<string, never>;
    }): Promise<{ id: string; organizationId: string }>;
    findFirst(args: { where: { organizationId: string; idempotencyKey: string } }): Promise<{ id: string } | null>;
  };
  aiTransactionMappingWorkItem: {
    upsert(args: {
      where: { proposalId: string };
      create: Record<string, unknown>;
      update: Record<string, never>;
    }): Promise<unknown>;
  };
  aiTransactionMappingReview: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
}
/** Review history is append-only at the application boundary; UNIQUE(proposalId) rejects replay. */
export class PrismaAiMappingRepository implements AiMappingRepository {
  constructor(private readonly db: MappingPrismaClient) {}
  async saveProposalAndWorkItem({ decision, workItem, authenticatedTenantId }: {
    decision: MappingDecision; workItem: MappingWorkItem; authenticatedTenantId: string;
  }): Promise<{ proposalKey: string; created: boolean }> {
    assertMappingTenant(decision.tenantId, authenticatedTenantId);
    assertMappingTenant(workItem.tenantId, authenticatedTenantId);
    if (workItem.key !== decision.idempotencyKey || workItem.transactionId !== decision.transactionId) {
      throw new Error("MAPPING_WORK_ITEM_MISMATCH");
    }
    return this.db.$transaction(async tx => {
      const where = { organizationId: authenticatedTenantId, idempotencyKey: decision.idempotencyKey };
      const prior = await tx.aiTransactionMappingProposal.findFirst({ where });
      const proposal = await tx.aiTransactionMappingProposal.upsert({
        where: { organizationId_idempotencyKey: where },
        create: {
          organizationId: authenticatedTenantId, transactionId: decision.transactionId,
          sourceHash: decision.sourceHash, idempotencyKey: decision.idempotencyKey,
          accountId: decision.accountId, confidence: decision.confidence,
          explanation: decision.explanation, agent: decision.agent, route: decision.route,
          status: decision.status, modelVersion: decision.modelVersion,
          policyVersion: decision.policyVersion, evidenceIds: decision.evidenceIds,
        },
        update: {},
      });
      await tx.aiTransactionMappingWorkItem.upsert({
        where: { proposalId: proposal.id },
        create: {
          proposalId: proposal.id, organizationId: authenticatedTenantId,
          assignedRole: workItem.assignedRole, state: workItem.state,
          priority: workItem.priority, reason: workItem.reason,
        },
        update: {},
      });
      return { proposalKey: decision.idempotencyKey, created: !prior };
    });
  }
  async recordReview({ review, authenticatedTenantId }: {
    review: MappingReview; authenticatedTenantId: string;
  }): Promise<void> {
    assertMappingTenant(review.tenantId, authenticatedTenantId);
    await this.db.$transaction(async tx => {
      const proposal = await tx.aiTransactionMappingProposal.findFirst({
        where: { organizationId: authenticatedTenantId, idempotencyKey: review.proposalKey },
      });
      if (!proposal) throw new Error("MAPPING_PROPOSAL_NOT_FOUND");
      await tx.aiTransactionMappingReview.create({
        data: {
          proposalId: proposal.id, organizationId: authenticatedTenantId,
          reviewerId: review.reviewerId, action: review.action,
          selectedAccountId: review.selectedAccountId, reason: review.reason,
        },
      });
    });
  }
  async listWorkItems({ authenticatedTenantId, assignedRole }: {
    authenticatedTenantId: string; assignedRole: MappingWorkItem["assignedRole"];
  }): Promise<readonly MappingWorkItem[]> {
    if (!authenticatedTenantId) throw new Error("TENANT_MISMATCH");
    const rows = await this.db.aiTransactionMappingWorkItem.findMany({
      where: { organizationId: authenticatedTenantId, assignedRole }, include: { proposal: true },
    });
    return rows.map(row => ({
      key: row.proposal.idempotencyKey,
      tenantId: row.proposal.organizationId,
      transactionId: row.proposal.transactionId,
      assignedRole: row.assignedRole as MappingWorkItem["assignedRole"],
      state: row.state as MappingWorkItem["state"],
      priority: row.priority as MappingWorkItem["priority"],
      reason: row.reason,
    }));
  }
}
