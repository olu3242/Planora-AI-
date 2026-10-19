import "server-only";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/permissions/permissions";
import { getTenantExecution } from "@/runtime/execution-runtime";
import type { CleanupFinding } from "@/domain/accounting/bookkeeping-cleanup";

type ReviewContext = { organizationId: string; role: RoleCode };
type StoredResult = { batchId: string; findings: CleanupFinding[] };
function isStoredResult(value: unknown): value is StoredResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return typeof result.batchId === "string" && Array.isArray(result.findings) &&
    result.findings.every(f => !!f && typeof f === "object" &&
      typeof f.transactionId === "string" &&
      (f.kind === "DUPLICATE_CANDIDATE" || f.kind === "INVALID_INPUT") &&
      f.requiresReview === true);
}
/** Read-only review queue backed by the existing durable RuntimeExecution table.
 * The role must be derived by the caller from an authenticated organization membership.
 * No finding is marked resolved or automatically applied.
 */
export async function listBookkeepingCleanupRuns(context: ReviewContext, limit = 50) {
  assertPermission(context.role, "accounting.recommendation.review");
  if (!context.organizationId) throw new Error("Organization scope required.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid page size.");
  const runs = await prisma.runtimeExecution.findMany({
    where: { organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", status: { in: ["SUCCEEDED", "RECOVERED"] } },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: limit,
    select: { id: true, targetId: true, status: true, result: true, startedAt: true },
  });
  return runs.filter(run => isStoredResult(run.result)).map(run => ({
    executionId: run.id, batchId: run.targetId, status: run.status,
    startedAt: run.startedAt, findings: (run.result as unknown as StoredResult).findings,
  }));
}
export async function getBookkeepingCleanupRun(context: ReviewContext, executionId: string) {
  assertPermission(context.role, "accounting.recommendation.review");
  if (!context.organizationId || !executionId) throw new Error("Organization and execution IDs required.");
  const run = await getTenantExecution(context.organizationId, executionId);
  if (run.command !== "BOOKKEEPING.CLEANUP_PROPOSE" || !isStoredResult(run.result)) {
    throw new Error("Cleanup findings unavailable for this execution.");
  }
  return { executionId: run.id, batchId: run.targetId, status: run.status, findings: run.result.findings };
}
