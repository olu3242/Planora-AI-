export const accountingReleaseGates = [
  "prisma-schema-validated",
  "test-database-migrated",
  "atomic-posting-certified",
  "period-close-race-certified",
  "tenant-rbac-certified",
  "audit-immutability-certified",
  "reconciliation-certified",
  "fpa-lineage-certified",
  "browser-e2e-certified",
  "forecast-regression-certified",
] as const;

export type AccountingReleaseGate = (typeof accountingReleaseGates)[number];
export type GateEvidence = Readonly<{
  gate: AccountingReleaseGate;
  passed: boolean;
  evidence: string;
}>;

export function classifyAccountingRelease(evidence: readonly GateEvidence[]): "READY_FOR_REVIEW" | "BLOCKED" {
  const allPassed = accountingReleaseGates.every((gate) =>
    evidence.some((item) => item.gate === gate && item.passed && item.evidence.trim().length > 0));
  return allPassed ? "READY_FOR_REVIEW" : "BLOCKED";
}
