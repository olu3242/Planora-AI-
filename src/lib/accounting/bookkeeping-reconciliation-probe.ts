import type { CleanupIssue } from "./bookkeeping-cleanup";

export type ReconciliationProbe = Readonly<{
  id: string;
  status: "MATCHED" | "UNMATCHED" | "EXCLUDED";
  matchedJournalId: string | null;
  journal: null | Readonly<{
    id: string;
    organizationId: string;
    legalEntityId: string;
    fiscalPeriodId: string;
    status: "DRAFT" | "POSTED";
    postedAt: Date | null;
  }>;
}>;

export function detectReconciliationIssues(
  records: readonly ReconciliationProbe[],
  scope: { organizationId: string; legalEntityId: string; fiscalPeriodId: string },
): CleanupIssue[] {
  const issues: CleanupIssue[] = [];
  for (const record of records) {
    if (record.status === "EXCLUDED") continue;
    const invalid = record.status === "MATCHED" && (
      !record.matchedJournalId || !record.journal ||
      record.journal.id !== record.matchedJournalId ||
      record.journal.organizationId !== scope.organizationId ||
      record.journal.legalEntityId !== scope.legalEntityId ||
      record.journal.fiscalPeriodId !== scope.fiscalPeriodId ||
      record.journal.status !== "POSTED" || !record.journal.postedAt
    );
    if (record.status !== "UNMATCHED" && !invalid) continue;
    issues.push({
      key: (invalid ? "broken:" : "unmatched:") + record.id,
      kind: invalid ? "BROKEN_MATCH" : "UNMATCHED_BANK",
      severity: invalid ? "HIGH" : "MEDIUM",
      recordIds: [record.id],
      recommendation: "Investigate the bank-to-ledger link and obtain independent evidence before correction.",
      requiresApproval: true,
    });
  }
  return issues.sort((a, b) => a.key.localeCompare(b.key));
}
