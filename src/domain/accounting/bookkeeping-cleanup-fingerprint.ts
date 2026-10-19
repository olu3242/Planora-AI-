import { createHash } from "node:crypto";
import type { CleanupTransaction } from "./bookkeeping-cleanup";
/** Stable batch fingerprint for audit comparison; not an authorization token. */
export function cleanupBatchFingerprint(transactions: readonly CleanupTransaction[]) {
  const canonical = transactions.map(t => [t.organizationId, t.id, t.date, t.amountMinor, t.currency, t.description.normalize("NFKC").trim(), t.reference?.normalize("NFKC").trim() ?? ""]);
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
