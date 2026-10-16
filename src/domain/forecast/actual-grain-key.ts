export type ActualGrain = Readonly<{ accountId: string; currencyCode: string; costCenterId: string | null }>;
export function actualGrainKey(value: ActualGrain): string {
  if (!value.accountId || !/^[A-Z]{3}$/.test(value.currencyCode)) throw new Error('INVALID_ACTUAL_GRAIN');
  return JSON.stringify([value.accountId, value.currencyCode, value.costCenterId]);
}
