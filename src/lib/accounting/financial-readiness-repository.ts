import type { ReadinessEvidence, ReadinessResult, ReadinessScope } from "./financial-readiness";
import { evaluateFinancialReadiness } from "./financial-readiness";
import { withMappingTenant } from "./ai-mapping-tenant-transaction";
import { verifyReadinessScopeInTransaction } from "./financial-readiness-scope-query";

export interface ReadinessDb {
  $transaction<T>(fn: (tx: ReadinessTx) => Promise<T>): Promise<T>;
}
export interface ReadinessTx {
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  legalEntity: { findFirst(args: unknown): Promise<{ organizationId: string; active: boolean } | null> };
  fiscalPeriod: { findUnique(args: unknown): Promise<{ year: { calendar: { organizationId: string } } } | null> };
  financialReadinessAssessment: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
  financialReadinessEvidence: {
    createMany(args: { data: readonly Record<string, unknown>[] }): Promise<unknown>;
  };
}
export type ReadinessSnapshotRequest = Readonly<{
  scope: ReadinessScope;
  checks: readonly ReadinessEvidence[];
  policyVersion: string;
  sourceFingerprint: string;
}>;
/** Atomic immutable snapshot. Caller must be an authenticated, authorized server service. */
export async function saveReadinessSnapshot(db: ReadinessDb, authenticatedOrganizationId: string, input: ReadinessSnapshotRequest): Promise<ReadinessResult> {
  if (authenticatedOrganizationId !== input.scope.organizationId) throw new Error("TENANT_MISMATCH");
  if (!input.policyVersion.trim() || !input.sourceFingerprint.trim()) throw new Error("READINESS_VERSION_REQUIRED");
  const result = evaluateFinancialReadiness(input.scope, input.checks);
  await withMappingTenant(db, authenticatedOrganizationId, async connection => {
    const tx = connection as ReadinessTx;
    await verifyReadinessScopeInTransaction(tx, authenticatedOrganizationId, input.scope.legalEntityId, input.scope.periodId);
    const row = await tx.financialReadinessAssessment.create({
      data: {
        organizationId: input.scope.organizationId, legalEntityId: input.scope.legalEntityId,
        periodId: input.scope.periodId, asOf: new Date(input.scope.asOf),
        score: result.score, status: result.status, blockers: [...result.blockers],
        actions: [...result.actions], dimensions: result.dimensions,
        policyVersion: input.policyVersion, sourceFingerprint: input.sourceFingerprint,
      },
    });
    await tx.financialReadinessEvidence.createMany({
      data: input.checks.map(check => ({
        assessmentId: row.id, organizationId: authenticatedOrganizationId,
        checkId: check.checkId, dimension: check.dimension, status: check.status,
        weight: check.weight, material: check.material, sourceEvidenceIds: [...check.sourceEvidenceIds],
        verifiedAt: check.verifiedAt ? new Date(check.verifiedAt) : null,
        expiresAt: check.expiresAt ? new Date(check.expiresAt) : null,
        ownerRole: check.ownerRole,
      })),
    });
  });
  return result;
}
