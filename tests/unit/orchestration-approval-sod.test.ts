import { describe, expect, it } from "vitest";
import { MemoryWorkflowRunStore } from "../../src/lib/orchestration/runtime";
import { startWorkflow, approveWorkflowStep } from "../../src/lib/orchestration/service";
import type { WorkflowDefinition } from "../../src/lib/orchestration/types";

const definition: WorkflowDefinition = { id: "approval-test", version: 1, steps: [{ id: "approval", kind: "HUMAN_APPROVAL", requiresApproval: true }] };

describe("workflow approval segregation of duties", () => {
 it("prevents the requester approving their own workflow", async () => {
  const store = new MemoryWorkflowRunStore();
  await startWorkflow(definition,"run",{organizationId:"org",actorId:"requester",correlationId:"corr"},{actorId:"requester",organizationId:"org",canStart:true,canApprove:false},store);
  const run = await store.load("run"); if (!run) throw new Error("missing run");
  run.status="WAITING_APPROVAL"; run.steps.approval.status="WAITING_APPROVAL"; await store.save(run);
  await expect(approveWorkflowStep("run","approval","evidence",{actorId:"requester",organizationId:"org",canStart:false,canApprove:true},store)).rejects.toThrow("Requester cannot approve own workflow");
 });
 it("allows a different authorized approver", async () => {
  const store = new MemoryWorkflowRunStore();
  await startWorkflow(definition,"run",{organizationId:"org",actorId:"requester",correlationId:"corr"},{actorId:"requester",organizationId:"org",canStart:true,canApprove:false},store);
  const run = await store.load("run"); if (!run) throw new Error("missing run");
  run.status="WAITING_APPROVAL"; run.steps.approval.status="WAITING_APPROVAL"; await store.save(run);
  const approved=await approveWorkflowStep("run","approval","evidence",{actorId:"controller",organizationId:"org",canStart:false,canApprove:true},store);
  expect(approved.steps.approval.status).toBe("SUCCEEDED");
 });
});
