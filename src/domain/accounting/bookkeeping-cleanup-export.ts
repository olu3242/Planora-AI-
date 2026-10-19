import type { CleanupFinding } from "./bookkeeping-cleanup";
const csv = (value: string) => {
  // Prevent spreadsheet formula execution when opened in Excel or similar tools.
  const safe = /^[=+@\-\t\r]/.test(value.trimStart()) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
};
export function cleanupFindingsCsv(findings: readonly CleanupFinding[]): string {
  const header = "transactionId,kind,relatedTransactionId,reason,requiresReview";
  const rows = findings.map(f => [f.transactionId, f.kind, f.relatedTransactionId ?? "", f.reason, String(f.requiresReview)].map(csv).join(","));
  return [header, ...rows].join("\r\n");
}
