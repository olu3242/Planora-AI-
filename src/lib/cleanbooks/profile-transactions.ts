/**
 * CleanBooks B1: read-only transaction profiling.
 * Amounts are integer minor currency units. No financial postings occur here.
 */
export type CleanupTransaction = {
  id: string;
  organizationId: string;
  legalEntityId: string;
  currency: string;
  amountMinor: number;
  bookedAt: string;
  description: string;
  sourceReference?: string | null;
  accountId?: string | null;
};

export type CleanupException = {
  transactionId: string;
  code: "INVALID_AMOUNT" | "INVALID_DATE" | "MISSING_DESCRIPTION" |
    "MISSING_ACCOUNT" | "POSSIBLE_DUPLICATE" | "CROSS_SCOPE";
  severity: "ERROR" | "WARNING";
  evidence: string;
  relatedTransactionId?: string;
};

export function profileTransactions(
  transactions: readonly CleanupTransaction[],
  scope: { organizationId: string; legalEntityId: string },
): { scanned: number; exceptions: CleanupException[]; canPost: false } {
  if (!scope.organizationId || !scope.legalEntityId) throw new Error("Scope required");
  const exceptions: CleanupException[] = [];
  const seen = new Map<string, string>();
  for (const t of transactions) {
    if (t.organizationId !== scope.organizationId || t.legalEntityId !== scope.legalEntityId) {
      exceptions.push({ transactionId: t.id, code: "CROSS_SCOPE", severity: "ERROR", evidence: "Transaction outside authorized scope" });
      continue;
    }
    if (!Number.isSafeInteger(t.amountMinor)) exceptions.push({ transactionId: t.id, code: "INVALID_AMOUNT", severity: "ERROR", evidence: "Amount must be a safe integer in minor units" });
    const dateShapeValid = /^\d{4}-\d{2}-\d{2}$/.test(t.bookedAt);
    const parsedDate = dateShapeValid ? new Date(t.bookedAt) : null;
    const dateValid = parsedDate !== null && !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === t.bookedAt;
    if (!dateValid) {
      exceptions.push({ transactionId: t.id, code: "INVALID_DATE", severity: "ERROR", evidence: "Invalid ISO posting date" });
    }
    if (!t.description.trim()) exceptions.push({ transactionId: t.id, code: "MISSING_DESCRIPTION", severity: "WARNING", evidence: "Blank description" });
    if (!t.accountId) exceptions.push({ transactionId: t.id, code: "MISSING_ACCOUNT", severity: "WARNING", evidence: "No account assigned" });
    if (Number.isSafeInteger(t.amountMinor) && dateValid && t.currency) {
      const key = JSON.stringify([t.currency, t.amountMinor, t.bookedAt, t.description.trim().toLowerCase(), t.sourceReference ?? ""]);
      const prior = seen.get(key);
      if (prior) exceptions.push({ transactionId: t.id, code: "POSSIBLE_DUPLICATE", severity: "WARNING", evidence: "Exact normalized transaction fingerprint", relatedTransactionId: prior });
      else seen.set(key, t.id);
    }
  }
  return { scanned: transactions.length, exceptions, canPost: false };
}
