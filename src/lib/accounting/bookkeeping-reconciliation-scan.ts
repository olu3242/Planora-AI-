import "server-only";
import { prisma } from "@/lib/prisma";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";
import { detectReconciliationIssues } from "./bookkeeping-reconciliation-probe";
import { registerCleanupIssue } from "./bookkeeping-cleanup-repository";

/** Advisory scan only. Writes deterministic work cases; never posts or matches bank records. */
export async function scanReconciliationForCleanup(input: {
  organizationId: string; legalEntityId: string; fiscalPeriodId: string;
}) {
  const issues = await withMappingTenant(prisma, input.organizationId, async connection => {
    const tx = connection as typeof prisma;
    await verifyReadinessScopeInTransaction(tx, input.organizationId, input.legalEntityId, input.fiscalPeriodId);
    const period = await tx.fiscalPeriod.findUniqueOrThrow({
      where: { id: input.fiscalPeriodId }, select: { startDate: true, endDate: true },
    });
    const accounts = await tx.bankAccount.findMany({
      where: { organizationId: input.organizationId, legalEntityId: input.legalEntityId },
      select: {
        transactions: {
          where: { postedDate: { gte: period.startDate, lte: period.endDate } },
          select: {
            id: true, status: true, matchedJournalId: true,
            matchedJournal: { select: { id: true, organizationId: true, legalEntityId: true, fiscalPeriodId: true, status: true, postedAt: true } },
          },
          take: 1001,
        },
      },
      take: 101,
    });
    if (accounts.length > 100 || accounts.some(a => a.transactions.length > 1000)) {
      throw new Error("CLEANUP_SCAN_INCOMPLETE");
    }
    return detectReconciliationIssues(accounts.flatMap(a => a.transactions.map(t => ({
      id: t.id, status: t.status, matchedJournalId: t.matchedJournalId, journal: t.matchedJournal,
    }))), input);
  });
  const cases = [];
  for (const issue of issues) {
    cases.push(await registerCleanupIssue(input.organizationId, input.legalEntityId, input.fiscalPeriodId, issue));
  }
  return { issueCount: issues.length, cases, mode: "ADVISORY_NOT_CERTIFIED" as const };
}
