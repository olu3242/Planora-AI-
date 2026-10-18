/**
 * Atomic, tenant-scoped run claim for the existing WorkflowRunRecord table.
 *
 * This is a one-time claim, NOT a renewable lease. A crash after claiming
 * leaves the run RUNNING until a separately governed recovery procedure acts.
 * Never automatically re-run financial handlers solely because a timeout elapsed.
 */
export interface WorkflowClaimDatabase {
  workflowRunRecord: {
    updateMany(args: {
      where: {
        id: string;
        organizationId: string;
        definitionId: string;
        definitionVersion: number;
        status: "READY";
      };
      data: { status: "RUNNING" };
    }): Promise<{ count: number }>;
  };
}

export interface WorkflowClaimRequest {
  organizationId: string;
  runId: string;
  definitionId: string;
  definitionVersion: number;
}

export async function claimReadyWorkflowRun(
  db: WorkflowClaimDatabase,
  request: WorkflowClaimRequest,
): Promise<void> {
  if (!request.organizationId.trim() || !request.runId.trim() || !request.definitionId.trim()) {
    throw new Error("WORKFLOW_SCOPE_CLAIM_REQUIRED");
  }
  if (!Number.isInteger(request.definitionVersion) || request.definitionVersion < 1) {
    throw new Error("INVALID_WORKFLOW_DEFINITION_VERSION");
  }
  // One SQL UPDATE with a READY predicate is an atomic compare-and-swap.
  // The unique run ID and organization scope prevent cross-tenant claims.
  const result = await db.workflowRunRecord.updateMany({
    where: {
      id: request.runId,
      organizationId: request.organizationId,
      definitionId: request.definitionId,
      definitionVersion: request.definitionVersion,
      status: "READY",
    },
    data: { status: "RUNNING" },
  });
  if (result.count !== 1) {
    throw new Error("WORKFLOW_SCOPE_CLAIM_UNAVAILABLE");
  }
}
