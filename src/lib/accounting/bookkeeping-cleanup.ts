/** Bookkeeping cleanup detection is advisory. Never post, delete or reverse financial records. */
export type CleanupIssue = Readonly<{
  key: string;
  kind: "DUPLICATE_SOURCE" | "UNMATCHED_BANK" | "BROKEN_MATCH" | "DRAFT_JOURNAL" | "UNBALANCED_JOURNAL";
  severity: "HIGH" | "MEDIUM";
  recordIds: readonly string[];
  recommendation: string;
  requiresApproval: true;
}>;
export type CleanupJournal = Readonly<{
  id: string; sourceKey: string; status: "DRAFT" | "POSTED";
  lines: readonly { debitMinor: bigint; creditMinor: bigint }[];
}>;
export type CleanupBankTransaction = Readonly<{
  id: string; bankAccountId: string; externalId: string;
  status: "UNMATCHED" | "MATCHED" | "EXCLUDED"; matchedJournalId: string | null;
}>;
export function detectBookkeepingCleanupIssues(input: {
  journals: readonly CleanupJournal[];
  bankTransactions: readonly CleanupBankTransaction[];
}): CleanupIssue[] {
  const issues: CleanupIssue[] = [];
  const seen = new Map<string, string>();
  for (const journal of input.journals) {
    const previous = seen.get(journal.sourceKey);
    if (previous) issues.push({
      key: `duplicate:${journal.id}`, kind: "DUPLICATE_SOURCE", severity: "HIGH",
      recordIds: [previous, journal.id], recommendation: "Investigate repeated source references; do not delete posted entries.", requiresApproval: true,
    });
    else seen.set(journal.sourceKey, journal.id);
    if (journal.status === "DRAFT") issues.push({
      key: `draft:${journal.id}`, kind: "DRAFT_JOURNAL", severity: "MEDIUM",
      recordIds: [journal.id], recommendation: "Review draft coding and evidence before authorized posting.", requiresApproval: true,
    });
    if (journal.status === "POSTED" && (journal.lines.length < 2 ||
      journal.lines.some(line => line.debitMinor < 0n || line.creditMinor < 0n || (line.debitMinor > 0n) === (line.creditMinor > 0n)) ||
      journal.lines.reduce((balance, line) => balance + line.debitMinor - line.creditMinor, 0n) !== 0n)) {
      issues.push({
        key: `balance:${journal.id}`, kind: "UNBALANCED_JOURNAL", severity: "HIGH",
        recordIds: [journal.id], recommendation: "Escalate for accounting investigation and approved correcting journal.", requiresApproval: true,
      });
    }
  }
  for (const transaction of input.bankTransactions) {
    if (transaction.status === "UNMATCHED") issues.push({
      key: `unmatched:${transaction.id}`, kind: "UNMATCHED_BANK", severity: "MEDIUM",
      recordIds: [transaction.id], recommendation: "Investigate bank-to-ledger match using supporting evidence.", requiresApproval: true,
    });
    if (transaction.status === "MATCHED" && !transaction.matchedJournalId) issues.push({
      key: `broken:${transaction.id}`, kind: "BROKEN_MATCH", severity: "HIGH",
      recordIds: [transaction.id], recommendation: "Revalidate reconciliation evidence and correct the broken link through approved workflow.", requiresApproval: true,
    });
  }
  return issues.sort((a, b) => a.key.localeCompare(b.key));
}
