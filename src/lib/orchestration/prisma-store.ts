import "server-only";
import { prisma } from "@/lib/prisma";
import type { RuntimeExecutionRecord, RuntimeExecutionStore, WorkflowRunStore } from "./runtime";
import type { WorkflowRun } from "./types";

export class PrismaWorkflowRunStore implements WorkflowRunStore {
  async load(runId: string): Promise<WorkflowRun | null> {
    const row = await prisma.workflowRunRecord.findUnique({ where: { id: runId } });
    return (row?.state as unknown as WorkflowRun | undefined) ?? null;
  }

  async save(run: WorkflowRun): Promise<void> {
    await prisma.workflowRunRecord.upsert({
      where: { id: run.id },
      create: {
        id: run.id,
        organizationId: run.context.organizationId,
        definitionId: run.definitionId,
        definitionVersion: run.definitionVersion,
        status: run.status,
        state: run as object,
      },
      update: { status: run.status, state: run as object },
    });
  }
}

export class PrismaRuntimeExecutionStore implements RuntimeExecutionStore {
  async load(idempotencyKey: string): Promise<RuntimeExecutionRecord | null> {
    const row = await prisma.workflowExecutionRecord.findUnique({ where: { idempotencyKey } });
    if (!row) return null;
    return {
      idempotencyKey: row.idempotencyKey,
      runId: row.runId,
      stepId: row.stepId,
      status: row.status as RuntimeExecutionRecord["status"],
      evidenceId: row.evidenceId ?? undefined,
      error: row.error ?? undefined,
    };
  }

  async save(record: RuntimeExecutionRecord): Promise<void> {
    await prisma.workflowExecutionRecord.upsert({
      where: { idempotencyKey: record.idempotencyKey },
      create: record,
      update: {
        status: record.status,
        evidenceId: record.evidenceId,
        error: record.error,
      },
    });
  }
}
