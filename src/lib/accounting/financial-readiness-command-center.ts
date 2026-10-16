import type { ReadinessResult, ReadinessScope } from "./financial-readiness";

/** A projection of immutable assessment records for the Finance Command Center. */
export type ReadinessSnapshotRow = Readonly<{
  id: string;
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  asOf: Date;
  createdAt: Date;
  score: number | null;
  status: string;
  blockers: unknown;
  actions: unknown;
  dimensions: unknown;
  policyVersion: string;
  sourceFingerprint: string;
}>;
export type ReadinessCommandCenterView = Readonly<{
  assessmentId: string;
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  score: number | null;
  status: ReadinessResult["status"];
  blockers: readonly string[];
  actions: ReadinessResult["actions"];
  dimensions: ReadinessResult["dimensions"];
  policyVersion: string;
  sourceFingerprint: string;
  assessedAt: string;
  recordedAt: string;
  disclaimer: string;
}>;
const allowedStatuses = new Set(["BLOCKED", "INCOMPLETE", "CANDIDATE_FOR_APPROVAL"]);
const dimensionNames = ["DATA_COMPLETENESS", "BOOKKEEPING_INTEGRITY", "RECONCILIATION", "ACCOUNTING_CONTROLS", "CLOSE_READINESS", "REPORTING_READINESS"] as const;
const roles = new Set(["BOOKKEEPER", "ACCOUNTANT", "CONTROLLER", "CFO"]);
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function projectReadinessSnapshot(row: ReadinessSnapshotRow, scope: ReadinessScope): ReadinessCommandCenterView {
  if (row.organizationId !== scope.organizationId || row.legalEntityId !== scope.legalEntityId || row.periodId !== scope.periodId) {
    throw new Error("READINESS_SCOPE_MISMATCH");
  }
  if (!allowedStatuses.has(row.status) || (row.score !== null && (!Number.isInteger(row.score) || row.score < 0 || row.score > 100))) {
    throw new Error("INVALID_READINESS_SNAPSHOT");
  }
  if (!Array.isArray(row.blockers) || !row.blockers.every(x => typeof x === "string") ||
      !Array.isArray(row.actions) || !row.actions.every(x => record(x) && typeof x.checkId === "string" && roles.has(String(x.ownerRole)) && typeof x.reason === "string") ||
      !record(row.dimensions) || !dimensionNames.every(name => {
        const d = row.dimensions[name];
        return record(d) && (d.score === null || (typeof d.score === "number" && Number.isInteger(d.score) && d.score >= 0 && d.score <= 100)) &&
          typeof d.checks === "number" && Number.isInteger(d.checks) && d.checks >= 0;
      })) {
    throw new Error("INVALID_READINESS_SNAPSHOT");
  }
  if (row.status === "CANDIDATE_FOR_APPROVAL" && (row.blockers.length || row.score !== 100)) {
    throw new Error("INVALID_READINESS_SNAPSHOT");
  }
  return {
    assessmentId: row.id, organizationId: row.organizationId, legalEntityId: row.legalEntityId,
    periodId: row.periodId, score: row.score, status: row.status,
    blockers: row.blockers as string[], actions: row.actions as ReadinessResult["actions"],
    dimensions: row.dimensions as ReadinessResult["dimensions"],
    policyVersion: row.policyVersion, sourceFingerprint: row.sourceFingerprint,
    assessedAt: row.asOf.toISOString(), recordedAt: row.createdAt.toISOString(),
    disclaimer: "Operational readiness only; not an audit opinion or authorization to close a period or post journals.",
  };
}
