import "server-only";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/auth/session";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { assessReadinessSources, type SourceControl } from "./financial-readiness-source-adapters";
import type { ReadinessScope } from "./financial-readiness";
import { journalPreflight, bankPreflight } from "./financial-readiness-diagnostics";
import { assertReadinessScopeOwnership } from "./financial-readiness-scope";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const control = (id: string, status: SourceControl["status"], evidenceIds: string[], asOf: string): SourceControl => ({
  id, status, evidenceIds, verifiedAt: status === "PASS" ? asOf : null, material: true, weight: 1,
});
/**
 * Authenticated read-only live preflight. Does NOT persist a certified snapshot.
 * PASS is reserved for independently verified controls; record presence alone
 * is never treated as completed reconciliation, approved journals, or reporting.
 */
export async function previewLiveReadiness(legalEntityId: string, fiscalPeriodId: string) {
  const session = await requireApiSession("financial.read");
  if (session.membership.role === "PLATFORM_ADMIN") throw new Error("FORBIDDEN_READINESS");
  if (!uuid.test(legalEntityId) || !uuid.test(fiscalPeriodId)) throw new Error("INVALID_READINESS_SCOPE");
  const organizationId = session.organization.id;
  const scope: ReadinessScope = { organizationId, legalEntityId, periodId: fiscalPeriodId, asOf: new Date().toISOString() };
  return withMappingTenant(prisma, organizationId, async transaction => {
    const db = transaction as typeof prisma;
    const entity = await db.legalEntity.findFirst({ where: { id: legalEntityId, organizationId, active: true }, select: { id: true, organizationId: true, active: true } });
    if (!entity) throw new Error("READINESS_SCOPE_NOT_FOUND");
    const period = await db.fiscalPeriod.findUnique({ where: { id: fiscalPeriodId }, select: { id: true, accountingCloseState: true, startDate: true, endDate: true, year: { select: { calendar: { select: { organizationId: true } } } } } });
    assertReadinessScopeOwnership({ organizationId, legalEntity: entity, fiscalPeriod: period });
    if (!period) throw new Error("READINESS_SCOPE_NOT_FOUND");
    const [journals, bankAccounts, reportingRuns] = await Promise.all([
      db.accountingJournal.findMany({
        where: { organizationId, legalEntityId, fiscalPeriodId },
        select: { id: true, status: true, postedAt: true, lines: { select: { debitMinor: true, creditMinor: true } } },
        take: 1001,
      }),
      db.bankAccount.findMany({
        where: { organizationId, legalEntityId },
        select: { id: true, transactions: { where: { postedDate: { gte: period.startDate, lte: period.endDate } }, select: { id: true, status: true, matchedJournalId: true }, take: 1001 } },
        take: 101,
      }),
      db.reportingRun.findMany({
        where: { organizationId, legalEntityId, fiscalPeriodId },
        select: { id: true, status: true, publishedAt: true },
        take: 101,
      }),
    ]);
    const truncated = journals.length > 1000 || bankAccounts.length > 100 || bankAccounts.some(a => a.transactions.length > 1000) || reportingRuns.length > 100;
    const allBankTransactions = bankAccounts.flatMap(a => a.transactions);
    const journal = journalPreflight(journals, truncated);
    const bank = bankPreflight(allBankTransactions, truncated);
    const { drafts, unbalanced } = journal;
    const { unmatched } = bank;
    const result = assessReadinessSources({
      scope,
      completeness: [control("SOURCE_COVERAGE", "UNKNOWN", [], scope.asOf)],
      bookkeeping: [control("POSTED_JOURNAL_INTEGRITY", journal.status, journals.map(j => j.id), scope.asOf)],
      reconciliation: [control("BANK_RECONCILIATION", bank.status, allBankTransactions.map(t => t.id), scope.asOf)],
      accountingControls: [control("APPROVAL_AND_POLICY_VERIFICATION", "UNKNOWN", [], scope.asOf)],
      reporting: [control("STATEMENT_RELEASE", reportingRuns.some(r => r.status === "DRAFT") ? "FAIL" : "UNKNOWN", reportingRuns.map(r => r.id), scope.asOf)],
      closeRun: null,
      fpa: null, fpaScopeVerified: false,
    });
    return {
      ...result, mode: "LIVE_PREFLIGHT_UNCERTIFIED" as const,
      sourceCounts: { journals: journals.length, draftJournals: drafts.length, unbalancedPostedJournals: unbalanced.length, bankAccounts: bankAccounts.length, bankTransactions: allBankTransactions.length, unmatchedBankTransactions: unmatched.length, reportingRuns: reportingRuns.length },
      warnings: [
        "Source record counts do not establish completeness, approval, reconciliation, or reporting certification.",
        ...(truncated ? ["Result sets exceeded safe scan limits; checks remain unverified."] : []),
        "Close and FP&A certifications are not yet connected to the live preflight.",
      ],
    };
  });
}
