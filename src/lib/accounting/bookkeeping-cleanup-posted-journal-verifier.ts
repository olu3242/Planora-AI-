import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { assertCleanupJournalLink } from "./bookkeeping-cleanup-journal-link";
import { verifyCleanupAfterAccountingExecution } from "./bookkeeping-cleanup-verification";
import type { CleanupCase } from "./bookkeeping-cleanup-workflow";

/** Trusted, read-only proof against the authoritative posted journal. Does not post. */
export async function verifyPostedJournalCleanup(input: {
  organizationId: string; caseId: string; journalId: string;
  verifierId: string; expectedRevision: number;
}): Promise<CleanupCase> {
  return withMappingTenant(prisma, input.organizationId, async connection => {
    const tx = connection as typeof prisma;
    const row = await tx.bookkeepingCleanupCase.findFirst({
      where: { id: input.caseId, organizationId: input.organizationId },
    });
    if (!row) throw new Error("CLEANUP_CASE_NOT_FOUND");
    await verifyReadinessScopeInTransaction(tx, input.organizationId, row.legalEntityId, row.fiscalPeriodId);
    if (row.state !== "EXECUTION_PENDING") throw new Error("CLEANUP_NOT_EXECUTION_PENDING");
    if (row.revision !== input.expectedRevision) throw new Error("STALE_CLEANUP_REVISION");
    const journal = await tx.accountingJournal.findFirst({
      where: {
        id: input.journalId, organizationId: input.organizationId,
        legalEntityId: row.legalEntityId, fiscalPeriodId: row.fiscalPeriodId,
        status: "POSTED", postedAt: { not: null },
      },
      select: {
        id: true, postedAt: true, postedById: true, reversalOfId: true,
        lines: { select: { debitMinor: true, creditMinor: true } },
      },
    });
    if (!journal || !journal.postedAt || journal.lines.length < 2 ||
      journal.lines.some(l => l.debitMinor < 0n || l.creditMinor < 0n || (l.debitMinor > 0n) === (l.creditMinor > 0n)) ||
      journal.lines.reduce((sum, l) => sum + l.debitMinor - l.creditMinor, 0n) !== 0n) {
      throw new Error("CLEANUP_ACCOUNTING_PROOF_MISSING");
    }
    if (journal.postedById === input.verifierId || row.proposedBy === input.verifierId) {
      throw new Error("CLEANUP_INDEPENDENCE_REQUIRED");
    }
    // Posted journal existence is necessary but not sufficient proof of issue resolution.
    // A matching source correction link and independent reconciliation are still required.
    assertCleanupJournalLink(row.issue as unknown as CleanupCase["issue"], journal.reversalOfId);
    const current: CleanupCase = {
      id: row.id, organizationId: row.organizationId, legalEntityId: row.legalEntityId,
      fiscalPeriodId: row.fiscalPeriodId, issue: row.issue as unknown as CleanupCase["issue"],
      state: row.state as CleanupCase["state"], revision: row.revision,
      assignedRole: row.assignedRole as CleanupCase["assignedRole"],
      proposal: row.proposal, proposedBy: row.proposedBy, approvedBy: row.approvedBy,
      evidenceIds: row.evidenceIds as string[], history: row.history as unknown as CleanupCase["history"],
    };
    const next = verifyCleanupAfterAccountingExecution(current, {
      receiptId: `journal:${journal.id}:posted:${journal.postedAt.toISOString()}`,
      caseId: row.id, organizationId: row.organizationId,
      legalEntityId: row.legalEntityId, fiscalPeriodId: row.fiscalPeriodId,
      accountingOperationId: journal.id, operationType: "CORRECTING_JOURNAL",
      outcome: "SUCCEEDED", verifiedBy: input.verifierId,
      verifiedAt: new Date().toISOString(), sourceRevision: journal.postedAt.toISOString(),
    }, { actorId: input.verifierId, actorRole: "ACCOUNTANT", expectedRevision: input.expectedRevision });
    const updated = await tx.bookkeepingCleanupCase.updateMany({
      where: { id: row.id, organizationId: row.organizationId, revision: row.revision, state: "EXECUTION_PENDING" },
      data: { state: next.state, revision: next.revision, evidenceIds: [...next.evidenceIds], history: [...next.history] as never, updatedAt: new Date() },
    });
    if (updated.count !== 1) throw new Error("STALE_CLEANUP_REVISION");
    return next;
  });
}
