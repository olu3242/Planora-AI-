import type { CleanupFinding } from "@/domain/accounting/bookkeeping-cleanup";
export function summarizeCleanupFindings(findings: readonly CleanupFinding[]) {
  const invalid = findings.filter(f => f.kind === "INVALID_INPUT").length;
  const duplicateCandidates = findings.filter(f => f.kind === "DUPLICATE_CANDIDATE").length;
  return { total: findings.length, invalid, duplicateCandidates, requiresReview: findings.length > 0 };
}
