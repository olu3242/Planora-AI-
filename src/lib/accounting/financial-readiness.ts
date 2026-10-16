import { closeBlockers, type CloseRun } from "@/domain/accounting/close-os";
import type { FpaConvergence } from "@/domain/accounting/fpa-convergence";
import type { MappingDecision } from "./ai-mapping-engine";

export type ReadinessDimension =
  | "DATA_COMPLETENESS" | "BOOKKEEPING_INTEGRITY" | "RECONCILIATION"
  | "ACCOUNTING_CONTROLS" | "CLOSE_READINESS" | "REPORTING_READINESS";
export type ReadinessEvidence = Readonly<{
  id: string;
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  dimension: ReadinessDimension;
  checkId: string;
  status: "PASS" | "FAIL" | "UNKNOWN";
  weight: number;
  material: boolean;
  sourceEvidenceIds: readonly string[];
  verifiedAt: string | null;
  expiresAt?: string;
  ownerRole: "BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER" | "CFO";
}>;
export type ReadinessScope = Readonly<{ organizationId: string; legalEntityId: string; periodId: string; asOf: string }>;
export type ReadinessResult = Readonly<{
  scope: ReadinessScope;
  score: number | null;
  status: "BLOCKED" | "INCOMPLETE" | "CANDIDATE_FOR_APPROVAL";
  dimensions: Readonly<Record<ReadinessDimension, { score: number | null; checks: number }>>;
  blockers: readonly string[];
  actions: readonly { checkId: string; ownerRole: ReadinessEvidence["ownerRole"]; reason: string }[];
  assessedAt: string;
}>;
export const READINESS_WEIGHTS: Readonly<Record<ReadinessDimension, number>> = {
  DATA_COMPLETENESS: 15, BOOKKEEPING_INTEGRITY: 20, RECONCILIATION: 25,
  ACCOUNTING_CONTROLS: 20, CLOSE_READINESS: 15, REPORTING_READINESS: 5,
};
const dimensions = Object.keys(READINESS_WEIGHTS) as ReadinessDimension[];
/** Deterministic, evidence-gated evaluation. Never substitutes for an audit opinion. */
export function evaluateFinancialReadiness(scope: ReadinessScope, checks: readonly ReadinessEvidence[]): ReadinessResult {
  if (![scope.organizationId, scope.legalEntityId, scope.periodId].every(Boolean) || !Number.isFinite(Date.parse(scope.asOf))) {
    throw new Error("INVALID_READINESS_SCOPE");
  }
  const seen = new Set<string>();
  const blockers: string[] = [];
  const actions: ReadinessResult["actions"][number][] = [];
  const scores = {} as Record<ReadinessDimension, { score: number | null; checks: number }>;
  let total = 0;
  let incomplete = false;
  for (const dim of dimensions) {
    const relevant = checks.filter(c => c.dimension === dim);
    if (!relevant.length) {
      incomplete = true;
      blockers.push(`MISSING_DIMENSION_${dim}`);
      scores[dim] = { score: null, checks: 0 };
      continue;
    }
    let passed = 0, possible = 0;
    for (const check of relevant) {
      if (check.organizationId !== scope.organizationId || check.legalEntityId !== scope.legalEntityId || check.periodId !== scope.periodId) {
        throw new Error("READINESS_SCOPE_MISMATCH");
      }
      const key = `${dim}:${check.checkId}`;
      if (!check.id || !check.checkId || seen.has(key) || !Number.isFinite(check.weight) || check.weight <= 0) {
        throw new Error("INVALID_READINESS_CHECK");
      }
      seen.add(key);
      possible += check.weight;
      const verified = !!check.verifiedAt && Number.isFinite(Date.parse(check.verifiedAt)) &&
        Date.parse(check.verifiedAt) <= Date.parse(scope.asOf) &&
        (!check.expiresAt || (Number.isFinite(Date.parse(check.expiresAt)) && Date.parse(check.expiresAt) >= Date.parse(scope.asOf)));
      const valid = check.status === "PASS" && verified && check.sourceEvidenceIds.length > 0 &&
        check.sourceEvidenceIds.every(Boolean);
      if (valid) passed += check.weight;
      else {
        const reason = check.status === "FAIL" ? "FAILED" : !verified ? "STALE_OR_UNVERIFIED" : "INCOMPLETE";
        if (check.material) blockers.push(`MATERIAL_${key}_${reason}`);
        if (!valid) incomplete = true;
        actions.push({ checkId: key, ownerRole: check.ownerRole, reason });
      }
    }
    const score = Math.round(100 * passed / possible);
    scores[dim] = { score, checks: relevant.length };
    total += READINESS_WEIGHTS[dim] * score / 100;
  }
  return {
    scope, score: dimensions.some(d => scores[d].score === null) ? null : Math.round(total),
    status: blockers.length ? "BLOCKED" : incomplete ? "INCOMPLETE" : "CANDIDATE_FOR_APPROVAL",
    dimensions: scores, blockers: [...new Set(blockers)].sort(), actions,
    assessedAt: scope.asOf,
  };
}
/** Close certification is authoritative; readiness cannot overrule its hard blockers. */
export function closeReadinessEvidence(run: CloseRun, scope: ReadinessScope): ReadinessEvidence[] {
  if (run.organizationId !== scope.organizationId || run.legalEntityId !== scope.legalEntityId || run.periodId !== scope.periodId) {
    throw new Error("READINESS_SCOPE_MISMATCH");
  }
  const blockers = closeBlockers(run);
  return [{
    id: `close:${scope.periodId}`, organizationId: scope.organizationId,
    legalEntityId: scope.legalEntityId, periodId: scope.periodId,
    dimension: "CLOSE_READINESS", checkId: "CLOSE_PREREQUISITES",
    status: blockers.length ? "FAIL" : "PASS", weight: 1, material: true,
    sourceEvidenceIds: blockers.length ? [] : run.tasks.map(t => t.evidence!).filter(Boolean),
    verifiedAt: scope.asOf, ownerRole: "CONTROLLER",
  }];
}
/** Mapping confidence is NOT readiness: only independently validated decisions qualify. */
export function mappingReadinessEvidence(decisions: readonly MappingDecision[], scope: ReadinessScope): ReadinessEvidence {
  if (decisions.some(d => d.tenantId !== scope.organizationId)) throw new Error("READINESS_SCOPE_MISMATCH");
  return {
    id: `mapping:${scope.periodId}`, organizationId: scope.organizationId,
    legalEntityId: scope.legalEntityId, periodId: scope.periodId,
    dimension: "BOOKKEEPING_INTEGRITY", checkId: "MAPPING_REVIEW",
    status: decisions.length ? "UNKNOWN" : "UNKNOWN", weight: 1, material: false,
    sourceEvidenceIds: decisions.flatMap(d => d.evidenceIds),
    verifiedAt: null, ownerRole: "ACCOUNTANT",
  };
}
export function fpaReadinessBlockers(fpa: FpaConvergence): readonly string[] {
  return fpa.status === "PASS" ? [] : fpa.blockers.map(b => `FPA_${b}`);
}
