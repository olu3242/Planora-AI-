import "server-only";
import { prisma } from "@/lib/prisma";

export async function getWorkflowOperations(organizationId: string) {
  const runs = await prisma.workflowRunRecord.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true, definitionId: true, definitionVersion: true, status: true, actorId: true, updatedAt: true,
      executions: { select: { stepId: true, status: true, error: true } },
    },
  });
  return {
    runs,
    attention: runs.filter((run) => ["FAILED", "BLOCKED", "WAITING_APPROVAL"].includes(run.status)).length,
  };
}

export async function getApprovalInbox(organizationId: string, actorId: string) {
  const rows = await prisma.workflowRunRecord.findMany({
    where: { organizationId, status: "WAITING_APPROVAL", NOT: { actorId } },
    orderBy: { updatedAt: "asc" },
    take: 50,
    select: { id: true, definitionId: true, status: true, state: true, updatedAt: true, actorId: true },
  });
  return rows.map((row) => ({
    id: row.id, definitionId: row.definitionId, status: row.status, state: row.state,
    updatedAt: row.updatedAt, requesterId: row.actorId, approverId: actorId,
  }));
}
