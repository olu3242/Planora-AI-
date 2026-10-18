import { describe, expect, it, vi } from "vitest";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { executeGovernedWorkflow } from "../../src/lib/orchestration/governed-runtime";
import { MemoryRuntimeExecutionStore, MemoryWorkflowRunStore, RuntimeRegistry } from "../../src/lib/orchestration/runtime";
import type { GovernedRunEnvelope, CatalogScenarioContract } from "../../src/lib/orchestration/catalog-contract";
import type { WorkflowDefinition } from "../../src/lib/orchestration/types";

const definition: WorkflowDefinition = {
  id: "monthly-close", version: 1, steps: [{ id: "validate", kind: "DETERMINISTIC" }],
};
const scenario: CatalogScenarioContract = {
  id: "E1", engine: "CORE", financialMutation: false,
  requiresHumanGate: false, executionAuthority: "CORE_ONLY",
};
const envelope: GovernedRunEnvelope = {
  organizationId: "tenant-a", runId: "run-1", correlationId: "trace-1",
  workflowDefinitionId: "monthly-close", workflowDefinitionVersion: 1,
  policyVersion: "policy-1", idempotencyKey: "tenant-a:run-1",
  actorId: "actor-1",
};

function setup() {
  const runs = new MemoryWorkflowRunStore();
  const executions = new MemoryRuntimeExecutionStore();
  const registry = new RuntimeRegistry();
  const handler = vi.fn(async () => ({ evidenceId: "evidence-1" }));
  registry.register("validate", handler);
  const authorize = vi.fn(async () => {});
  const seed = () => runs.save(createWorkflowRun(envelope.runId, definition, {
    organizationId: envelope.organizationId,
    actorId: envelope.actorId,
    correlationId: envelope.correlationId,
  }));
  const execute = (changes: Partial<GovernedRunEnvelope> = {}, overrides: Record<string, unknown> = {}) =>
    executeGovernedWorkflow({
      envelope: { ...envelope, ...changes }, definition, scenario, executor: "CORE",
      runs, executions, registry, authorize, ...overrides,
    });
  return { seed, execute, authorize, handler };
}

describe("governed runtime fail-closed boundary", () => {
  it("executes after core policy authorization", async () => {
    const test = setup();
    await test.seed();
    const result = await test.execute();
    expect(result.status).toBe("SUCCEEDED");
    expect(test.authorize).toHaveBeenCalledOnce();
    expect(test.handler).toHaveBeenCalledOnce();
  });

  it.each([
    ["tenant", { organizationId: "tenant-b" }],
    ["actor", { actorId: "actor-b" }],
    ["correlation", { correlationId: "trace-b" }],
    ["definition version", { workflowDefinitionVersion: 2 }],
    ["policy version", { policyVersion: "" }],
    ["idempotency", { idempotencyKey: "" }],
  ])("rejects mismatched %s before invoking a handler", async (_name, change) => {
    const test = setup();
    await test.seed();
    await expect(test.execute(change)).rejects.toThrow();
    expect(test.handler).not.toHaveBeenCalled();
    expect(test.authorize).not.toHaveBeenCalled();
  });

  it("rejects an external executor even for nonfinancial work", async () => {
    const test = setup();
    await test.seed();
    await expect(test.execute({}, { executor: "N8N" })).rejects.toThrow("FORBIDDEN_EXTERNAL_RUNTIME_EXECUTION");
    expect(test.handler).not.toHaveBeenCalled();
  });

  it("does not invoke a handler when policy authorization rejects", async () => {
    const test = setup();
    await test.seed();
    test.authorize.mockRejectedValueOnce(new Error("FORBIDDEN_POLICY"));
    await expect(test.execute()).rejects.toThrow("FORBIDDEN_POLICY");
    expect(test.handler).not.toHaveBeenCalled();
  });

  it("requires approval evidence for gated financial mutations", async () => {
    const test = setup();
    await test.seed();
    await expect(test.execute({}, {
      scenario: { ...scenario, financialMutation: true, requiresHumanGate: true },
    })).rejects.toThrow("FORBIDDEN_MISSING_APPROVAL_EVIDENCE");
    expect(test.handler).not.toHaveBeenCalled();
  });
});
