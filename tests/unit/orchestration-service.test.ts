import { describe, expect, it } from "vitest";
import { CLOSE_TO_FORECAST_WORKFLOW } from "../../src/lib/orchestration/close-to-forecast";
import { MemoryWorkflowRunStore } from "../../src/lib/orchestration/runtime";
import { approveWorkflowStep, OrchestrationAuthorizationError, startWorkflow } from "../../src/lib/orchestration/service";
const context={organizationId:"org-1",legalEntityId:"entity-1",fiscalPeriodId:"period-1",actorId:"actor-1",correlationId:"corr-1"};
describe("orchestration service authorization",()=>{
  it("rejects cross-organization workflow context",async()=>{const store=new MemoryWorkflowRunStore();await expect(startWorkflow(CLOSE_TO_FORECAST_WORKFLOW,"run-1",context,{actorId:"actor-1",organizationId:"org-2",canStart:true,canApprove:false},store)).rejects.toBeInstanceOf(OrchestrationAuthorizationError);});
  it("rejects approval without approval authority",async()=>{const store=new MemoryWorkflowRunStore();const auth={actorId:"actor-1",organizationId:"org-1",canStart:true,canApprove:false};await startWorkflow(CLOSE_TO_FORECAST_WORKFLOW,"run-2",context,auth,store);await expect(approveWorkflowStep("run-2","controller-approval","ev",auth,store)).rejects.toBeInstanceOf(OrchestrationAuthorizationError);});
  it("prevents duplicate run identifiers",async()=>{const store=new MemoryWorkflowRunStore();const auth={actorId:"actor-1",organizationId:"org-1",canStart:true,canApprove:false};await startWorkflow(CLOSE_TO_FORECAST_WORKFLOW,"run-3",context,auth,store);await expect(startWorkflow(CLOSE_TO_FORECAST_WORKFLOW,"run-3",context,auth,store)).rejects.toThrow("Workflow run already exists");});
});
