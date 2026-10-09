import {
  beginStep,
  completeStep,
  finalizeRun,
  readySteps,
} from "./engine";
import type {
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStepDefinition,
} from "./types";

export interface StepExecutionResult {
  evidenceId: string;
}

export type StepHandler = (
  run: WorkflowRun,
  step: WorkflowStepDefinition,
) => Promise<StepExecutionResult>;

export interface WorkflowRunStore {
  load(runId: string): Promise<WorkflowRun | null>;
  save(run: WorkflowRun): Promise<void>;
}

export interface RuntimeExecutionRecord {
  idempotencyKey: string;
  runId: string;
  stepId: string;
  status: "RUNNING" | "RETRYING" | "SUCCEEDED" | "FAILED";
  attempts?: number;
  errorClass?: "RETRYABLE" | "TERMINAL";
  evidenceId?: string;
  error?: string;
}

export interface RuntimeExecutionStore {
  load(idempotencyKey: string): Promise<RuntimeExecutionRecord | null>;
  save(record: RuntimeExecutionRecord): Promise<void>;
}

export class RuntimeRegistry {
  private readonly handlers = new Map<string, StepHandler>();

  register(stepId: string, handler: StepHandler): void {
    if (this.handlers.has(stepId)) throw new Error(`Handler already registered for ${stepId}`);
    this.handlers.set(stepId, handler);
  }

  get(stepId: string): StepHandler {
    const handler = this.handlers.get(stepId);
    if (!handler) throw new Error(`No runtime handler registered for ${stepId}`);
    return handler;
  }
}

export function classifyRuntimeError(error: unknown): "RETRYABLE" | "TERMINAL" {
  const message = error instanceof Error ? error.message : "Unknown runtime failure";
  const terminalPrefixes = [
    "RUNTIME_CAPABILITY_PENDING:", "WORKFLOW_SCOPE_", "PERIOD_", "TRIAL_BALANCE_",
    "INVALID_", "FORBIDDEN", "TENANT_", "ENTITY_", "AUTHENTICATION_",
  ];
  return terminalPrefixes.some((prefix) => message.startsWith(prefix)) ? "TERMINAL" : "RETRYABLE";
}

export function stepIdempotencyKey(run: WorkflowRun, step: WorkflowStepDefinition): string {
  return [run.context.organizationId, run.id, run.definitionVersion, step.id].join(":");
}

export async function executeReadySteps(
  definition: WorkflowDefinition,
  runId: string,
  runs: WorkflowRunStore,
  executions: RuntimeExecutionStore,
  registry: RuntimeRegistry,
): Promise<WorkflowRun> {
  let run = await runs.load(runId);
  if (!run) throw new Error(`Workflow run not found: ${runId}`);

  for (const step of readySteps(definition, run)) {
    run = beginStep(run, step);
    await runs.save(run);

    if (run.steps[step.id]?.status === "WAITING_APPROVAL") {
      continue;
    }

    const key = stepIdempotencyKey(run, step);
    const existing = await executions.load(key);
    if (existing?.status === "SUCCEEDED" && existing.evidenceId) {
      run = completeStep(run, step.id, existing.evidenceId);
      await runs.save(run);
      continue;
    }

    const maxAttempts = Math.max(1, step.maxAttempts ?? 1);
    let attempt = existing?.attempts ?? 0;
    let result: StepExecutionResult | undefined;
    let lastError: unknown;
    while (attempt < maxAttempts) {
      attempt += 1;
      await executions.save({ idempotencyKey: key, runId, stepId: step.id, status: attempt > 1 ? "RETRYING" : "RUNNING", attempts: attempt });
      try {
        result = await registry.get(step.id)(run, step);
        break;
      } catch (error) {
        lastError = error;
        if (classifyRuntimeError(error) === "TERMINAL") break;
      }
    }

    try {
      if (!result) throw lastError ?? new Error("Runtime handler returned no result");
      await executions.save({
        idempotencyKey: key,
        runId,
        stepId: step.id,
        status: "SUCCEEDED",
        evidenceId: result.evidenceId,
        attempts: attempt,
      });
      run = completeStep(run, step.id, result.evidenceId);
      await runs.save(run);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown runtime failure";
      const errorClass = classifyRuntimeError(error);
      await executions.save({
        idempotencyKey: key,
        runId,
        stepId: step.id,
        status: "FAILED",
        attempts: attempt,
        errorClass,
        error: message,
      });
      run = {
        ...run,
        status: "FAILED",
        steps: {
          ...run.steps,
          [step.id]: { ...run.steps[step.id], status: "FAILED", error: message },
        },
      };
      await runs.save(run);
      return run;
    }
  }

  run = finalizeRun(run);
  await runs.save(run);
  return run;
}

export class MemoryWorkflowRunStore implements WorkflowRunStore {
  constructor(private readonly runs = new Map<string, WorkflowRun>()) {}
  async load(runId: string): Promise<WorkflowRun | null> { return this.runs.get(runId) ?? null; }
  async save(run: WorkflowRun): Promise<void> { this.runs.set(run.id, structuredClone(run)); }
}

export class MemoryRuntimeExecutionStore implements RuntimeExecutionStore {
  constructor(private readonly records = new Map<string, RuntimeExecutionRecord>()) {}
  async load(key: string): Promise<RuntimeExecutionRecord | null> { return this.records.get(key) ?? null; }
  async save(record: RuntimeExecutionRecord): Promise<void> { this.records.set(record.idempotencyKey, { ...record }); }
}
