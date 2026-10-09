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
