/** Pure preflight diagnostics. Never certify source completeness or reconciliation. */
export type JournalProbe = Readonly<{
  id: string; status: "DRAFT" | "POSTED"; postedAt: Date | null;
  lines: readonly { debitMinor: bigint; creditMinor: bigint }[];
}>;
export type BankProbe = Readonly<{
  id: string; status: "UNMATCHED" | "MATCHED" | "EXCLUDED"; matchedJournalId: string | null;
}>;
export function journalPreflight(journals: readonly JournalProbe[], truncated: boolean) {
  const drafts = journals.filter(j => j.status !== "POSTED" || !j.postedAt);
  const unbalanced = journals.filter(j => j.status === "POSTED" && (
    j.lines.length < 2 ||
    j.lines.some(l => l.debitMinor < 0n || l.creditMinor < 0n || (l.debitMinor > 0n) === (l.creditMinor > 0n)) ||
    j.lines.reduce((sum, l) => sum + l.debitMinor - l.creditMinor, 0n) !== 0n
  ));
  return {
    drafts, unbalanced,
    status: drafts.length || unbalanced.length ? "FAIL" as const : "UNKNOWN" as const,
  };
}
export function bankPreflight(transactions: readonly BankProbe[], truncated: boolean) {
  const unmatched = transactions.filter(t =>
    t.status === "UNMATCHED" || (t.status === "MATCHED" && !t.matchedJournalId)
  );
  return {
    unmatched,
    status: unmatched.length ? "FAIL" as const : "UNKNOWN" as const,
  };
}
