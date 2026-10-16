export type ForecastCoverageException = Readonly<{
  lineId: string;
  accountId: string;
  costCenterId: string;
  reason: 'ACTUAL_MISSING' | 'ACTUAL_UNALLOCATED' | 'ACTUAL_CURRENCY_AMBIGUOUS';
}>;

export function forecastCoverageException(input: Readonly<{
  lineId: string;
  accountId: string;
  costCenterId: string;
  actualCostCenters: readonly (string | null)[];
  actualCurrencies: readonly string[];
}>): ForecastCoverageException | null {
  const currencies = new Set(input.actualCurrencies);
  if (currencies.size > 1) return { lineId: input.lineId, accountId: input.accountId, costCenterId: input.costCenterId, reason: 'ACTUAL_CURRENCY_AMBIGUOUS' };
  if (input.actualCostCenters.includes(input.costCenterId)) return null;
  return { lineId: input.lineId, accountId: input.accountId, costCenterId: input.costCenterId,
    reason: input.actualCostCenters.includes(null) ? 'ACTUAL_UNALLOCATED' : 'ACTUAL_MISSING' };
}
