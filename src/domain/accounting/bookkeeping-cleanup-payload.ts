import type { CleanupTransaction } from "./bookkeeping-cleanup";
export function scopeCleanupTransactions<T extends Omit<CleanupTransaction, "organizationId">>(organizationId: string, transactions: readonly T[]): CleanupTransaction[] {
  if (!organizationId) throw new Error("Authenticated organization is required.");
  return transactions.map(transaction => ({ ...transaction, organizationId }));
}
