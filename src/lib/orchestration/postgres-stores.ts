import type { PrismaClient } from "@prisma/client";
import type { WorkflowRun, WorkflowRunStatus } from "./types";
import type {
  WorkflowRunStore, RuntimeExecutionStore, RuntimeExecutionRecord,
} from "./runtime";

/**
 * Database-backed adapters for the existing workflow tables.
 * Caller must enforce tenant authorization and use a transaction/worker lease
 * for concurrency-sensitive writes. These adapters do not grant authorization.
 */
export class PostgresWorkflowRunStore implements WorkflowRunStore {
  constructor(
    private readonly db: Pick<PrismaClient, "workflowRunRecord">,
    private readonly organizationId: string,
  ) {}

  async load(runId: string): Promise<WorkflowRun | null> {
    const record = await this.db.workflowRunRecord.findFirst({
      where: { id: runId, organizationId: this.organizationId },
    });
    if (!record) return null;
    const state = record.state as unknown as WorkflowRun;
    if (!state || state.id !== record.id ||
        state.definitionId !== record.definitionId ||
        state.definitionVersion !== record.definitionVersion ||
        state.context?.organizationId !== this.organizationId ||
        state.context?.actorId !== record.actorId ||
        state.status !== record.status) {
      throw new Error("WORKFLOW_SCOPE_PERSISTED_STATE_MISMATCH");
    }
    return state;
  }

  async save(run: WorkflowRun): Promise<void> {
    if (run.context.organizationId !== this.organizationId) {
      throw new Error("WORKFLOW_SCOPE_TENANT_MISMATCH");
    }
    const result = await this.db.workflowRunRecord.updateMany({
      where: {
        id: run.id,
        organizationId: this.organizationId,
        definitionId: run.definitionId,
        definitionVersion: run.definitionVersion,
        actorId: run.context.actorId,
      },
      data: {
        status: run.status,
        state: JSON.parse(JSON.stringify(run)),
      },
    });
    if (result.count !== 1) throw new Error("WORKFLOW_SCOPE_SAVE_UNAVAILABLE");
  }
}

export class PostgresRuntimeExecutionStore implements RuntimeExecutionStore {
  constructor(
    private readonly db: Pick<PrismaClient, "workflowExecutionRecord" | "workflowRunRecord">,
    private readonly organizationId: string,
  ) {}

  async load(key: string): Promise<RuntimeExecutionRecord | null> {
    const record = await this.db.workflowExecutionRecord.findFirst({
      where: { idempotencyKey: key, run: { organizationId: this.organizationId } },
    });
    if (!record) return null;
    return {
      idempotencyKey: record.idempotencyKey,
      runId: record.runId,
      stepId: record.stepId,
      status: record.status as RuntimeExecutionRecord["status"],
      evidenceId: record.evidenceId ?? undefined,
      error: record.error ?? undefined,
    };
  }

  async save(record: RuntimeExecutionRecord): Promise<void> {
    const run = await this.db.workflowRunRecord.findFirst({
      where: { id: record.runId, organizationId: this.organizationId },
      select: { id: true },
    });
    if (!run) throw new Error("WORKFLOW_SCOPE_EXECUTION_RUN_NOT_FOUND");
    const existing = await this.db.workflowExecutionRecord.findUnique({
      where: { idempotencyKey: record.idempotencyKey },
      select: { runId: true, stepId: true },
    });
    if (existing && (existing.runId !== record.runId || existing.stepId !== record.stepId)) {
      throw new Error("WORKFLOW_SCOPE_IDEMPOTENCY_COLLISION");
    }
    await this.db.workflowExecutionRecord.upsert({
      where: { idempotencyKey: record.idempotencyKey },
      create: {
        idempotencyKey: record.idempotencyKey,
        runId: record.runId,
        stepId: record.stepId,
        status: record.status,
        evidenceId: record.evidenceId,
        error: record.error,
      },
      update: {
        status: record.status,
        evidenceId: record.evidenceId ?? null,
        error: record.error ?? null,
      },
    });
  }
}
