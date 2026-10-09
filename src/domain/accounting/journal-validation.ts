/** Pure, deterministic validation. Monetary inputs are integer minor units. */
export type JournalLineInput = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
}>;

export function validateJournal(lines: readonly JournalLineInput[]): void {
  if (lines.length < 2) throw new Error("JOURNAL_REQUIRES_TWO_LINES");
  let debits = 0n;
  let credits = 0n;
  for (const line of lines) {
    if (!line.accountId.trim()) throw new Error("ACCOUNT_REQUIRED");
    if (line.debitMinor < 0n || line.creditMinor < 0n) throw new Error("NEGATIVE_AMOUNT");
    if ((line.debitMinor > 0n) === (line.creditMinor > 0n)) {
      throw new Error("EXACTLY_ONE_SIDE_REQUIRED");
    }
    debits += line.debitMinor;
    credits += line.creditMinor;
  }
  if (debits !== credits) throw new Error("UNBALANCED_JOURNAL");
}
