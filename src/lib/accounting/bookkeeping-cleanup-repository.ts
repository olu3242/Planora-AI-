import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { createCleanupCase, transitionCleanupCase, type CleanupAction, type CleanupCase } from "./bookkeeping-cleanup-workflow";
import type { CleanupIssue } from "./bookkeeping-cleanup";

/** Database persistence is a controlled case ledger, NOT an accounting executor. */
export async function registerCleanupIssue(
  organizationId: string, legalEntityId: string, fiscalPeriodId: string, issue: CleanupIssue,
): Promise<CleanupCase> {
  const initial = createCleanupCase({ organizationId, legalEntityId, fiscalPeriodId }, issue);
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    await verifyReadinessScopeInTransaction(tx, organizationId, legalEntityId, fiscalPeriodId);
    const row = await tx.bookkeepingCleanupCase.upsert({
      where: { id: initial.id },
      create: {
        id: initial.id, organizationId, legalEntityId, fiscalPeriodId, issueKey: issue.key,
        issue: issue as never, state: initial.state, revision: 0, assignedRole: initial.assignedRole,
        evidenceIds: [], history: [],
      },
      update: {},
    });
    return fromRow(row);
  });
}
type Stored = Awaited<ReturnType<typeof prisma.bookkeepingCleanupCase.findUniqueOrThrow>>;
function fromRow(row: Stored): CleanupCase {
  return {
    id: row.id, organizationId: row.organizationId, legalEntityId: row.legalEntityId,
    fiscalPeriodId: row.fiscalPeriodId, issue: row.issue as unknown as CleanupIssue,
    state: row.state as CleanupCase["state"], revision: row.revision,
    assignedRole: row.assignedRole as CleanupCase["assignedRole"],
    proposal: row.proposal, proposedBy: row.proposedBy, approvedBy: row.approvedBy,
    evidenceIds: row.evidenceIds as string[],
    history: row.history as unknown as CleanupCase["history"],
  };
}
/** Compare-and-swap prevents two reviewers from silently overwriting each other. */
export async function applyCleanupTransition(
  organizationId: string, caseId: string, action: CleanupAction,
): Promise<CleanupCase> {
  return withMappingTenant(prisma, organizationId, async connection => {
    const tx = connection as typeof prisma;
    const row = await tx.bookkeepingCleanupCase.findFirst({ where: { id: caseId, organizationId } });
    if (!row) throw new Error("CLEANUP_CASE_NOT_FOUND");
    await verifyReadinessScopeInTransaction(tx, organizationId, row.legalEntityId, row.fiscalPeriodId);
    const next = transitionCleanupCase(fromRow(row), action);
    const update = await tx.bookkeepingCleanupCase.updateMany({
      where: { id: caseId, organizationId, revision: action.expectedRevision },
      data: {
        state: next.state, revision: next.revision, assignedRole: next.assignedRole,
        proposal: next.proposal, proposedBy: next.proposedBy, approvedBy: next.approvedBy,
        evidenceIds: [...next.evidenceIds], history: [...next.history] as never,
        updatedAt: new Date(),
      },
    });
    if (update.count !== 1) throw new Error("STALE_CLEANUP_REVISION");
    return next;
  });
}
