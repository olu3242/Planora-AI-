import "server-only";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/permissions/permissions";
import { getTenantExecution } from "@/runtime/execution-runtime";
import type { CleanupFinding } from "@/domain/accounting/bookkeeping-cleanup";

type Context = { organizationId: string; role: RoleCode };
type StoredResult = { batchId: string; findings: CleanupFinding[] };
type ReviewState = "PENDING" | "ACCEPT_FINDING" | "REJECT_FINDING";
function isStoredResult(value: unknown): value is StoredResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return typeof result.batchId === "string" && Array.isArray(result.findings) &&
    result.findings.every(f => f && typeof f === "object" &&
      typeof f.transactionId === "string" &&
      (f.kind === "DUPLICATE_CANDIDATE" || f.kind === "INVALID_INPUT") &&
      f.requiresReview === true);
}
function decisionState(value: unknown): ReviewState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const decision = (value as Record<string, unknown>).decision;
  return decision === "ACCEPT_FINDING" || decision === "REJECT_FINDING" ? decision : null;
}
/** Combine immutable review events with persisted proposal results; read-only. */
export async function getBookkeepingCleanupReviewState(context: Context, executionId: string) {
  assertPermission(context.role, "accounting.recommendation.review");
  if (!context.organizationId || !executionId) throw new Error("Organization and execution IDs required.");
  const execution = await getTenantExecution(context.organizationId, executionId);
  if (execution.command !== "BOOKKEEPING.CLEANUP_PROPOSE" ||
      !["SUCCEEDED", "RECOVERED"].includes(execution.status) ||
      !isStoredResult(execution.result)) {
    throw new Error("Cleanup execution is not reviewable.");
  }
  const findings = execution.result.findings;
  const keys = findings.map(f => `${execution.id}:${f.transactionId}:${f.kind}`);
  const events = keys.length ? await prisma.auditEvent.findMany({
    where: { organizationId: context.organizationId, entityType: "BookkeepingCleanupFinding",
      action: "BOOKKEEPING.CLEANUP_REVIEW_DECIDED", entityId: { in: keys } },
    orderBy: { occurredAt: "asc" },
    select: { id: true, entityId: true, actorId: true, occurredAt: true, newState: true },
  }) : [];
  const decisions = new Map<string, (typeof events)[number]>();
  for (const event of events) if (!decisions.has(event.entityId) && decisionState(event.newState)) decisions.set(event.entityId, event);
  return {
    executionId: execution.id, batchId: execution.targetId, status: execution.status,
    findings: findings.map(f => {
      const event = decisions.get(`${execution.id}:${f.transactionId}:${f.kind}`);
      return { ...f, review: {
        status: event ? decisionState(event.newState)! : "PENDING" as ReviewState,
        reviewId: event?.id ?? null, reviewerId: event?.actorId ?? null,
        decidedAt: event?.occurredAt ?? null,
      } };
    }),
  };
}
