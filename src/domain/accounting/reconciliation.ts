export type ReconciliationItem = Readonly<{ reference: string; amountMinor: bigint }>;
export type ReconciliationResult = Readonly<{
  matched: readonly string[];
  unmatchedBank: readonly ReconciliationItem[];
  unmatchedLedger: readonly ReconciliationItem[];
  bankTotalMinor: bigint;
  ledgerTotalMinor: bigint;
  differenceMinor: bigint;
}>;

/** Exact reference + amount matching only. Ambiguous matches remain unmatched for human review. */
export function reconcileExact(
  bank: readonly ReconciliationItem[],
  ledger: readonly ReconciliationItem[],
): ReconciliationResult {
  const key = (x: ReconciliationItem) => JSON.stringify([x.reference, x.amountMinor.toString()]);
  const bankCounts = new Map<string, number>();
  const ledgerCounts = new Map<string, number>();
  for (const item of bank) bankCounts.set(key(item), (bankCounts.get(key(item)) ?? 0) + 1);
  for (const item of ledger) ledgerCounts.set(key(item), (ledgerCounts.get(key(item)) ?? 0) + 1);
  const allowed = new Map<string, number>();
  for (const [k, count] of bankCounts) {
    if (count === 1 && ledgerCounts.get(k) === 1) allowed.set(k, 1);
  }
  const matched: string[] = [];
  const unmatchedBank: ReconciliationItem[] = [];
  for (const item of bank) {
    const k = key(item);
    if (allowed.get(k) === 1) { matched.push(item.reference); allowed.set(k, 0); }
    else unmatchedBank.push(item);
  }
  const unmatchedLedger = ledger.filter((item) => !matched.some((reference) =>
    reference === item.reference && bankCounts.get(key(item)) === 1 && ledgerCounts.get(key(item)) === 1));
  const bankTotalMinor = bank.reduce((n, x) => n + x.amountMinor, 0n);
  const ledgerTotalMinor = ledger.reduce((n, x) => n + x.amountMinor, 0n);
  return { matched, unmatchedBank, unmatchedLedger, bankTotalMinor, ledgerTotalMinor,
    differenceMinor: bankTotalMinor - ledgerTotalMinor };
}
