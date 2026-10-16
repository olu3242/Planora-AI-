export type ActualFactIdentity = Readonly<{
  accountId: string;
  currencyCode: string;
}>;

/** An account may have actuals in more than one currency. */
export function actualFactKey(value: ActualFactIdentity): string {
  if (!value.accountId.trim() || !/^[A-Z]{3}$/.test(value.currencyCode)) {
    throw new Error('INVALID_ACTUAL_FACT_IDENTITY');
  }
  return JSON.stringify([value.accountId, value.currencyCode]);
}

export function indexActualFacts<T extends ActualFactIdentity>(facts: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const fact of facts) {
    const key = actualFactKey(fact);
    if (index.has(key)) throw new Error('DUPLICATE_ACTUAL_FACT_GRAIN');
    index.set(key, fact);
  }
  return index;
}
