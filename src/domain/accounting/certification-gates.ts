export const accountingReleaseGates = [
  "prisma-schema-validated","test-database-migrated","atomic-posting-certified","period-close-race-certified",
  "tenant-rbac-certified","audit-immutability-certified","reconciliation-certified","fpa-lineage-certified",
  "reporting-framework-version-certified","reporting-disclosure-completeness-certified",
  "reporting-approval-segregation-certified","reporting-lock-certified",
  "browser-e2e-certified","forecast-regression-certified",
] as const;
export type AccountingReleaseGate=(typeof accountingReleaseGates)[number];
export type GateEvidence=Readonly<{gate:AccountingReleaseGate;passed:boolean;evidence:string}>;
export function classifyAccountingRelease(evidence:readonly GateEvidence[]):"READY_FOR_REVIEW"|"BLOCKED"{
 return accountingReleaseGates.every(g=>evidence.some(i=>i.gate===g&&i.passed&&i.evidence.trim().length>0))?"READY_FOR_REVIEW":"BLOCKED";
}
