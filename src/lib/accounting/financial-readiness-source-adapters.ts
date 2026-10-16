import { closeBlockers, type CloseRun } from "@/domain/accounting/close-os";
import type { FpaConvergence } from "@/domain/accounting/fpa-convergence";
import { evaluateFinancialReadiness, type ReadinessEvidence, type ReadinessResult, type ReadinessScope } from "./financial-readiness";

/** Source adapters must be tenant-scoped, immutable/versioned, and independently verified. */
export type SourceControl = Readonly<{
  id: string;
  status: "PASS" | "FAIL" | "UNKNOWN";
  evidenceIds: readonly string[];
  verifiedAt: string | null;
  expiresAt?: string;
  material: boolean;
  weight: number;
}>;
export type ReadinessSourceBundle = Readonly<{
  scope: ReadinessScope;
  completeness: readonly SourceControl[];
  bookkeeping: readonly SourceControl[];
  reconciliation: readonly SourceControl[];
  accountingControls: readonly SourceControl[];
  reporting: readonly SourceControl[];
  closeRun: CloseRun | null;
  fpa: FpaConvergence | null;
  /** Explicit evidence that the accounting-to-FP&A source scope matches this assessment. */
  fpaScopeVerified: boolean;
}>;
type Dimension = ReadinessEvidence["dimension"];
type Role = ReadinessEvidence["ownerRole"];
function convert(scope: ReadinessScope, dimension: Dimension, ownerRole: Role, checks: readonly SourceControl[]): ReadinessEvidence[] {
  return checks.map(check => ({
    id: check.id, organizationId: scope.organizationId, legalEntityId: scope.legalEntityId,
    periodId: scope.periodId, dimension, checkId: check.id, status: check.status,
    sourceEvidenceIds: check.evidenceIds, verifiedAt: check.verifiedAt,
    expiresAt: check.expiresAt, material: check.material, weight: check.weight, ownerRole,
  }));
}
function closeEvidence(scope: ReadinessScope, run: CloseRun | null): ReadinessEvidence[] {
  if (!run) return [];
  if (run.organizationId !== scope.organizationId || run.legalEntityId !== scope.legalEntityId || run.periodId !== scope.periodId) {
    throw new Error("READINESS_SCOPE_MISMATCH");
  }
  const blockers = closeBlockers(run);
  const ids = run.tasks.map(t => t.evidence).filter((id): id is string => !!id?.trim());
  return convert(scope, "CLOSE_READINESS", "CONTROLLER", [{
    id: "CLOSE_PREREQUISITES", status: blockers.length ? "FAIL" : "PASS",
    evidenceIds: ids, verifiedAt: scope.asOf, material: true, weight: 1,
  }]);
}
function fpaEvidence(bundle: ReadinessSourceBundle): ReadinessEvidence[] {
  const { scope, fpa, fpaScopeVerified } = bundle;
  if (!fpa || !fpaScopeVerified) return [];
  const valid = fpa.status === "PASS" && fpa.blockers.length === 0 && fpa.staleKeys.length === 0;
  // A PASS without source keys is not evidence of completed reporting.
  const ids = fpa.actuals.map(a => a.sourceKey).filter(Boolean);
  return convert(scope, "REPORTING_READINESS", "CFO", [{
    id: "FPA_ACTUALS_CONVERGENCE", status: valid ? "PASS" : "FAIL",
    evidenceIds: ids, verifiedAt: valid && ids.length ? scope.asOf : null,
    material: true, weight: 1,
  }]);
}
/** Aggregates verified source-control outcomes; it never synthesizes PASS from missing data. */
export function buildReadinessEvidence(bundle: ReadinessSourceBundle): ReadinessEvidence[] {
  const { scope } = bundle;
  return [
    ...convert(scope, "DATA_COMPLETENESS", "BOOKKEEPER", bundle.completeness),
    ...convert(scope, "BOOKKEEPING_INTEGRITY", "ACCOUNTANT", bundle.bookkeeping),
    ...convert(scope, "RECONCILIATION", "ACCOUNTANT", bundle.reconciliation),
    ...convert(scope, "ACCOUNTING_CONTROLS", "CONTROLLER", bundle.accountingControls),
    ...closeEvidence(scope, bundle.closeRun),
    ...convert(scope, "REPORTING_READINESS", "CFO", bundle.reporting),
    ...fpaEvidence(bundle),
  ];
}
export function assessReadinessSources(bundle: ReadinessSourceBundle): ReadinessResult {
  return evaluateFinancialReadiness(bundle.scope, buildReadinessEvidence(bundle));
}
