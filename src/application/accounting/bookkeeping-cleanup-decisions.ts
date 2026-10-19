import "server-only";
import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/audit/audit";
import { assertPermission } from "@/permissions/permissions";
import type { CleanupFinding } from "@/domain/accounting/bookkeeping-cleanup";
import { validateCleanupReviewInput } from "@/domain/accounting/bookkeeping-cleanup-review-policy";

export type CleanupDecision = "ACCEPT_FINDING" | "REJECT_FINDING";
export type CleanupDecisionContext = {
  organizationId: string; actorId: string; role: RoleCode; correlationId: string;
};
type StoredResult = { batchId: string; findings: CleanupFinding[] };
function hasFindings(value: unknown): value is StoredResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.batchId === "string" && Array.isArray(v.findings) &&
    v.findings.every(f => f && typeof f === "object" &&
      typeof f.transactionId === "string" &&
      (f.kind === "DUPLICATE_CANDIDATE" || f.kind === "INVALID_INPUT") &&
      f.requiresReview === true);
}
/**
 * Persist a human review decision as an immutable audit event. This only records
 * reviewer intent: it NEVER changes a bank transaction, journal, or source row.
 * Authenticated caller must derive actorId, organizationId and role from session.
 */
export async function decideBookkeepingCleanupFinding(
  context: CleanupDecisionContext,
  input: { executionId: string; transactionId: string; kind: CleanupFinding["kind"]; decision: CleanupDecision; reason: string },
) {
  assertPermission(context.role, "accounting.recommendation.review");
  if (!context.organizationId || !context.actorId || !context.correlationId ||
      !input.executionId || !input.transactionId || !["DUPLICATE_CANDIDATE", "INVALID_INPUT"].includes(input.kind) ||
      !["ACCEPT_FINDING", "REJECT_FINDING"].includes(input.decision) ||
      !input.reason.trim() || input.reason.length > 2000) {
    throw new Error("Invalid cleanup review decision.");
  }
  return prisma.$transaction(async tx => {
    // Serialize decisions on this execution to prevent concurrent double review.
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "RuntimeExecution"
      WHERE id = ${input.executionId}::uuid AND "organizationId" = ${context.organizationId}::uuid
      FOR UPDATE
    `;
    if (!locked.length) throw new Error("Cleanup execution not found.");
    const execution = await tx.runtimeExecution.findFirst({
      where: { id: input.executionId, organizationId: context.organizationId, command: "BOOKKEEPING.CLEANUP_PROPOSE", status: { in: ["SUCCEEDED", "RECOVERED"] } },
    });
    if (!execution || !hasFindings(execution.result)) throw new Error("Cleanup execution is not reviewable.");
    if (execution.actorId === context.actorId) throw new Error("Separation of duties: proposer cannot review own findings.");
    const finding = execution.result.findings.find(f => f.transactionId === input.transactionId && f.kind === input.kind);
    if (!finding) throw new Error("Finding does not exist in this execution.");
    const entityId = `${execution.id}:${input.transactionId}:${input.kind}`;
    const prior = await tx.auditEvent.findFirst({
      where: { organizationId: context.organizationId, entityType: "BookkeepingCleanupFinding", entityId, action: "BOOKKEEPING.CLEANUP_REVIEW_DECIDED" },
      select: { id: true },
    });
    if (prior) throw new Error("Finding already reviewed.");
    const event = await writeAudit(tx, {
      organizationId: context.organizationId,
      actorId: context.actorId,
      correlationId: context.correlationId,
      action: "BOOKKEEPING.CLEANUP_REVIEW_DECIDED",
      entityType: "BookkeepingCleanupFinding",
      entityId,
      newState: { decision: input.decision, reason: input.reason.trim(), executionId: execution.id, transactionId: input.transactionId, kind: input.kind },
      metadata: { batchId: execution.targetId, proposerId: execution.actorId },
    });
    return { reviewId: event.id, executionId: execution.id, transactionId: input.transactionId, decision: input.decision };
  });
}
