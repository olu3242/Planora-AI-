export type PostedLedgerLine = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
}>;
export type TrialBalanceRow = Readonly<{
  accountId: string;
  debitMinor: bigint;
  creditMinor: bigint;
}>;
/** Input must already be scoped to one organization, entity, period and currency
 * and restricted to POSTED journals by the authorized repository query. */
export function calculateTrialBalance(lines: readonly PostedLedgerLine[]): TrialBalanceRow[] {
  const net = new Map<string, bigint>();
  for (const line of lines) {
    if (!line.accountId.trim() || line.debitMinor < 0n || line.creditMinor < 0n ||
        (line.debitMinor > 0n) === (line.creditMinor > 0n)) {
      throw new Error("INVALID_POSTED_LINE");
    }
    net.set(line.accountId, (net.get(line.accountId) ?? 0n) + line.debitMinor - line.creditMinor);
  }
  return [...net.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([accountId, amount]) => ({
    accountId, debitMinor: amount > 0n ? amount : 0n,
    creditMinor: amount < 0n ? -amount : 0n,
  }));
}
export function assertTrialBalance(rows: readonly TrialBalanceRow[]): void {
  const debit = rows.reduce((sum, row) => sum + row.debitMinor, 0n);
  const credit = rows.reduce((sum, row) => sum + row.creditMinor, 0n);
  if (debit !== credit) throw new Error("TRIAL_BALANCE_OUT_OF_BALANCE");
}
