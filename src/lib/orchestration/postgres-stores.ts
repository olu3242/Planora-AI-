import type { PrismaClient } from "@prisma/client";
import type { WorkflowRun } from "./types";
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

  /**
   * Optimistic compare-and-swap for a previously loaded workflow snapshot.
   * Unlike save(), this refuses stale writes after another worker changes
   * either the persisted status or JSON state. Not yet used by the runner.
   */
  async saveIfUnchanged(run: WorkflowRun, expected: WorkflowRun): Promise<void> {
    if (run.id !== expected.id ||
        run.context.organizationId !== this.organizationId ||
        expected.context.organizationId !== this.organizationId ||
        run.definitionId !== expected.definitionId ||
        run.definitionVersion !== expected.definitionVersion ||
        run.context.actorId !== expected.context.actorId) {
      throw new Error("WORKFLOW_SCOPE_CAS_MISMATCH");
    }
    const result = await this.db.workflowRunRecord.updateMany({
      where: {
        id: expected.id,
        organizationId: this.organizationId,
        actorId: expected.context.actorId,
        definitionId: expected.definitionId,
        definitionVersion: expected.definitionVersion,
        status: expected.status,
        state: { equals: JSON.parse(JSON.stringify(expected)) },
      },
      data: {
        status: run.status,
        state: JSON.parse(JSON.stringify(run)),
      },
    });
    if (result.count !== 1) throw new Error("WORKFLOW_SCOPE_STALE_WRITE");
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
      attempts: record.attempts,
      errorClass: record.errorClass as RuntimeExecutionRecord["errorClass"],
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
    // Creation is guarded by the database unique idempotency key. An existing
    // execution may only move forward through an atomic conditional update.
    const attempts = record.attempts ?? 0;
    const data = {
      status: record.status,
      attempts,
      errorClass: record.errorClass ?? null,
      evidenceId: record.evidenceId ?? null,
      error: record.error ?? null,
    };
    const existing = await this.db.workflowExecutionRecord.findUnique({
      where: { idempotencyKey: record.idempotencyKey },
      select: { runId: true, stepId: true, status: true, attempts: true },
    });
    if (!existing) {
      try {
        await this.db.workflowExecutionRecord.create({
          data: {
            idempotencyKey: record.idempotencyKey,
            runId: record.runId,
            stepId: record.stepId,
            ...data,
          },
        });
        return;
      } catch (error) {
        // Concurrent insertion: do not overwrite the winner. Caller must
        // reload and reconcile instead of replaying financial side effects.
        if (typeof error === "object" && error !== null && "code" in error &&
            error.code === "P2002") {
          throw new Error("WORKFLOW_SCOPE_EXECUTION_CONCURRENT_INSERT");
        }
        throw error;
      }
    }
    if (existing.runId !== record.runId || existing.stepId !== record.stepId) {
      throw new Error("WORKFLOW_SCOPE_IDEMPOTENCY_COLLISION");
    }
    if (existing.status === "SUCCEEDED" || existing.status === "FAILED") {
      throw new Error("WORKFLOW_SCOPE_EXECUTION_TERMINAL_IMMUTABLE");
    }
    if (attempts < existing.attempts) {
      throw new Error("WORKFLOW_SCOPE_EXECUTION_ATTEMPT_REGRESSION");
    }
    const updated = await this.db.workflowExecutionRecord.updateMany({
      where: {
        idempotencyKey: record.idempotencyKey,
        runId: record.runId,
        stepId: record.stepId,
        status: existing.status,
        attempts: existing.attempts,
      },
      data,
    });
    if (updated.count !== 1) {
      throw new Error("WORKFLOW_SCOPE_EXECUTION_STALE_WRITE");
    }
  }
}
