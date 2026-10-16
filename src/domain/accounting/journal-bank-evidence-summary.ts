export type BankEvidenceSummary = Readonly<{
  journalId: string;
  bankTransactionIds: readonly string[];
  displayedCount: number;
  truncated: boolean;
}>;

/** UI-only evidence metadata; never contributes to statement amounts. */
export function summarizeJournalBankEvidence(
  journalId: string, bankTransactionIds: readonly string[], limit: number,
): BankEvidenceSummary {
  if (!journalId.trim() || !Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('BANK_EVIDENCE_SUMMARY_INVALID');
  }
  const unique = [...new Set(bankTransactionIds)];
  return {
    journalId,
    bankTransactionIds: unique.slice(0, limit),
    displayedCount: unique.slice(0, limit).length,
    truncated: unique.length > limit,
  };
}
