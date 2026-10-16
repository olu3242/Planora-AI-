import type { ReadinessDimension, ReadinessResult } from "./financial-readiness";

/** Read-only projection of a persisted assessment, never a new certification. */
export type StoredReadinessAssessment = Readonly<{
  id: string;
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  asOf: Date;
  score: number | null;
  status: ReadinessResult["status"];
  blockers: unknown;
  actions: unknown;
  dimensions: unknown;
  policyVersion: string;
  sourceFingerprint: string;
  createdAt: Date;
}>;
const names: ReadinessDimension[] = ["DATA_COMPLETENESS","BOOKKEEPING_INTEGRITY","RECONCILIATION","ACCOUNTING_CONTROLS","CLOSE_READINESS","REPORTING_READINESS"];
const states = ["BLOCKED","INCOMPLETE","CANDIDATE_FOR_APPROVAL"] as const;
export function projectReadinessSnapshot(row: StoredReadinessAssessment, expectedOrganizationId: string) {
  if (row.organizationId !== expectedOrganizationId) throw new Error("TENANT_MISMATCH");
  if (!states.includes(row.status) || (row.score !== null && (!Number.isInteger(row.score) || row.score < 0 || row.score > 100))) throw new Error("INVALID_READINESS_SNAPSHOT");
  if (!Array.isArray(row.blockers) || !row.blockers.every(x => typeof x === "string")) throw new Error("INVALID_READINESS_SNAPSHOT");
  if (!Array.isArray(row.actions) || !row.actions.every(x => x && typeof x === "object" && typeof x.checkId === "string" && typeof x.reason === "string" && ["BOOKKEEPER","ACCOUNTANT","CONTROLLER","CFO"].includes(x.ownerRole))) throw new Error("INVALID_READINESS_SNAPSHOT");
  if (!row.dimensions || typeof row.dimensions !== "object" || Array.isArray(row.dimensions)) throw new Error("INVALID_READINESS_SNAPSHOT");
  const dimensions = row.dimensions as Record<string, unknown>;
  for (const name of names) {
    const d = dimensions[name] as { score?: unknown; checks?: unknown } | undefined;
    if (!d || (d.score !== null && (typeof d.score !== "number" || !Number.isInteger(d.score) || d.score < 0 || d.score > 100)) || !Number.isInteger(d.checks) || (d.checks as number) < 0) throw new Error("INVALID_READINESS_SNAPSHOT");
  }
  return {
    assessmentId: row.id, organizationId: row.organizationId, legalEntityId: row.legalEntityId,
    periodId: row.periodId, assessedAt: row.asOf.toISOString(), createdAt: row.createdAt.toISOString(),
    score: row.score, status: row.status, blockers: row.blockers,
    actions: row.actions, dimensions: row.dimensions,
    policyVersion: row.policyVersion, sourceFingerprint: row.sourceFingerprint,
    disclaimer: "Operational readiness is not an audit opinion or authorization to close or post.",
  };
}
