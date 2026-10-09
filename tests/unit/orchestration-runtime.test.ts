import { describe, expect, it, vi } from "vitest";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import {
  executeReadySteps,
  MemoryRuntimeExecutionStore,
  MemoryWorkflowRunStore,
  RuntimeRegistry,
} from "../../src/lib/orchestration/runtime";
import type { WorkflowDefinition } from "../../src/lib/orchestration/types";

const definition: WorkflowDefinition = {
  id: "runtime-test",
  version: 1,
  steps: [
    { id: "first", kind: "DETERMINISTIC" },
    { id: "approval", kind: "HUMAN_APPROVAL", dependsOn: ["first"], requiresApproval: true },
    { id: "mutate", kind: "DATABASE", dependsOn: ["approval"] },
  ],
};

const context = {
  organizationId: "org-1",
  actorId: "actor-1",
  correlationId: "corr-1",
};

describe("governed orchestration runtime", () => {
  it("executes ready deterministic work and stops before approval", async () => {
    const runStore = new MemoryWorkflowRunStore();
    const executionStore = new MemoryRuntimeExecutionStore();
    const registry = new RuntimeRegistry();
    const first = vi.fn(async () => ({ evidenceId: "ev-first" }));
    registry.register("first", first);
    registry.register("mutate", async () => ({ evidenceId: "ev-mutate" }));

    await runStore.save(createWorkflowRun("run-1", definition, context));
    const afterFirst = await executeReadySteps(definition, "run-1", runStore, executionStore, registry);
    expect(afterFirst.steps.first.status).toBe("SUCCEEDED");

    const awaiting = await executeReadySteps(definition, "run-1", runStore, executionStore, registry);
    expect(awaiting.status).toBe("WAITING_APPROVAL");
    expect(awaiting.steps.mutate.status).toBe("PENDING");
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("records failures and does not unlock dependent mutation", async () => {
    const failingDefinition: WorkflowDefinition = {
      id: "failure-test",
      version: 1,
      steps: [
        { id: "validate", kind: "DETERMINISTIC" },
        { id: "write", kind: "DATABASE", dependsOn: ["validate"] },
      ],
    };
    const runStore = new MemoryWorkflowRunStore();
    const executionStore = new MemoryRuntimeExecutionStore();
    const registry = new RuntimeRegistry();
    registry.register("validate", async () => { throw new Error("validation failed"); });
    registry.register("write", async () => ({ evidenceId: "never" }));

    await runStore.save(createWorkflowRun("run-2", failingDefinition, context));
    const failed = await executeReadySteps(failingDefinition, "run-2", runStore, executionStore, registry);
    expect(failed.status).toBe("FAILED");
    expect(failed.steps.validate.error).toBe("validation failed");
    expect(failed.steps.write.status).toBe("PENDING");
  });
});


describe("bounded retry policy", () => {
  it("retries transient failures only up to maxAttempts", async () => {
    const retryDefinition: WorkflowDefinition = {
      id: "retry-test", version: 1,
      steps: [{ id: "transient", kind: "INTEGRATION", maxAttempts: 3 }],
    };
    const runStore = new MemoryWorkflowRunStore();
    const executionStore = new MemoryRuntimeExecutionStore();
    const registry = new RuntimeRegistry();
    let attempts = 0;
    registry.register("transient", async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("NETWORK_TIMEOUT");
      return { evidenceId: "ev-recovered" };
    });
    await runStore.save(createWorkflowRun("run-retry", retryDefinition, context));
    const run = await executeReadySteps(retryDefinition, "run-retry", runStore, executionStore, registry);
    expect(attempts).toBe(3);
    expect(run.steps.transient.status).toBe("SUCCEEDED");
  });

  it("does not retry pending or financial validation failures", async () => {
    const terminalDefinition: WorkflowDefinition = {
      id: "terminal-test", version: 1,
      steps: [{ id: "pending-capability", kind: "DATABASE", maxAttempts: 5 }],
    };
    const runStore = new MemoryWorkflowRunStore();
    const executionStore = new MemoryRuntimeExecutionStore();
    const registry = new RuntimeRegistry();
    let attempts = 0;
    registry.register("pending-capability", async () => {
      attempts += 1;
      throw new Error("RUNTIME_CAPABILITY_PENDING:period-close-transaction");
    });
    await runStore.save(createWorkflowRun("run-terminal", terminalDefinition, context));
    const run = await executeReadySteps(terminalDefinition, "run-terminal", runStore, executionStore, registry);
    expect(attempts).toBe(1);
    expect(run.status).toBe("FAILED");
  });
});
