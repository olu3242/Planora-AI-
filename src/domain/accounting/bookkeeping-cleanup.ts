/** Deterministic, proposal-only bookkeeping cleanup. Never posts or mutates source records. */
export type CleanupTransaction = {
  id: string; organizationId: string; date: string; amountMinor: number;
  currency: string; description: string; reference?: string | null;
};
export type CleanupFinding = {
  transactionId: string; kind: "DUPLICATE_CANDIDATE" | "INVALID_INPUT";
  relatedTransactionId?: string; reason: string; requiresReview: true;
};
const normalized = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function proposeBookkeepingCleanup(transactions: readonly CleanupTransaction[]): CleanupFinding[] {
  const findings: CleanupFinding[] = [];
  const seen = new Map<string, string>();
  const ids = new Set<string>();
  for (const item of transactions) {
    if (!item.id || !item.organizationId || !validDate(item.date) ||
        !Number.isSafeInteger(item.amountMinor) || !/^[A-Z]{3}$/.test(item.currency) ||
        !item.description.trim() || ids.has(item.id)) {
      findings.push({ transactionId: item.id, kind: "INVALID_INPUT", reason: "Missing, malformed or repeated transaction identity / financial fields", requiresReview: true });
      continue;
    }
    ids.add(item.id);
    const scope = JSON.stringify([item.organizationId, item.currency, item.date, item.amountMinor]);
    const reference = normalized(item.reference ?? "");
    const description = normalized(item.description);
    // A reference alone is not sufficient: same amount, date and tenant are mandatory.
    const key = JSON.stringify([scope, reference ? "reference" : "description", reference || description]);
    const previous = seen.get(key);
    if (previous) findings.push({ transactionId: item.id, kind: "DUPLICATE_CANDIDATE", relatedTransactionId: previous, reason: "Same tenant, date, currency, amount and normalized reference/description", requiresReview: true });
    else seen.set(key, item.id);
  }
  return findings;
}
