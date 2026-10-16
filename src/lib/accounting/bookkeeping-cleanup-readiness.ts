import type { SourceControl } from "./financial-readiness-source-adapters";
export type CleanupReadinessCase = Readonly<{
  id: string; state: string; issueKey: string; evidenceIds: readonly string[];
}>;
/** Fail closed: a verified case alone cannot certify bookkeeping or bank reconciliation. */
export function cleanupReadinessControls(
  cases: readonly CleanupReadinessCase[],
  scanComplete: boolean,
  asOf: string,
): { bookkeeping: SourceControl; reconciliation: SourceControl } {
  const unresolved = cases.filter(c => c.state !== "VERIFIED");
  const bank = unresolved.filter(c => c.issueKey.startsWith("unmatched:") || c.issueKey.startsWith("broken:"));
  const ledger = unresolved.filter(c => !bank.includes(c));
  const evidenceIds = cases.flatMap(c => c.evidenceIds);
  const status = (blocked: number): SourceControl["status"] =>
    blocked ? "FAIL" : "UNKNOWN";
  return {
    bookkeeping: {
      id: "BOOKKEEPING_CLEANUP_CASES", status: status(ledger.length),
      evidenceIds, verifiedAt: null, material: true, weight: 1,
    },
    reconciliation: {
      id: "BANK_CLEANUP_CASES", status: status(bank.length),
      evidenceIds, verifiedAt: null, material: true, weight: 1,
    },
  };
}
