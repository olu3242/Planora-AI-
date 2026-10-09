import { describe, expect, it } from "vitest";
import { createWorkflowRun } from "../../src/lib/orchestration/engine";
import { executeReadySteps, MemoryRuntimeExecutionStore, MemoryWorkflowRunStore, RuntimeRegistry } from "../../src/lib/orchestration/runtime";
import type { WorkflowDefinition } from "../../src/lib/orchestration/types";

const definition:WorkflowDefinition={id:"close-contract",version:1,steps:[
 {id:"preflight",kind:"DETERMINISTIC"},
 {id:"bank-reconciliation",kind:"DATABASE",dependsOn:["preflight"]},
 {id:"ap-validation",kind:"DATABASE",dependsOn:["preflight"]},
 {id:"ar-validation",kind:"DATABASE",dependsOn:["preflight"]},
 {id:"trial-balance",kind:"DETERMINISTIC",dependsOn:["bank-reconciliation","ap-validation","ar-validation"]},
 {id:"close-analysis",kind:"AGENT",dependsOn:["trial-balance"]},
 {id:"controller-approval",kind:"HUMAN_APPROVAL",dependsOn:["close-analysis"],requiresApproval:true},
]};
const context={organizationId:"org",legalEntityId:"entity",fiscalPeriodId:"period",actorId:"actor",correlationId:"corr"};

describe("accounting close orchestration contract",()=>{
 it("stops the current dispatch batch at human approval and stays paused on retry",async()=>{
  const gated:WorkflowDefinition={id:"approval-batch",version:1,steps:[
   {id:"approval",kind:"HUMAN_APPROVAL",requiresApproval:true},
   {id:"independent-work",kind:"DETERMINISTIC"},
  ]};
  const runs=new MemoryWorkflowRunStore(); const executions=new MemoryRuntimeExecutionStore(); const registry=new RuntimeRegistry();
  let dispatched=0;
  registry.register("independent-work",async()=>{dispatched++;return {evidenceId:"unexpected"};});
  await runs.save(createWorkflowRun("approval-batch",gated,context));
  for(let i=0;i<2;i++){
   const run=await executeReadySteps(gated,"approval-batch",runs,executions,registry);
   expect(run.status).toBe("WAITING_APPROVAL");
   expect(run.steps["independent-work"].status).toBe("PENDING");
  }
  expect(dispatched).toBe(0);
 });
 it("blocks trial balance when a close prerequisite fails",async()=>{
  const runs=new MemoryWorkflowRunStore(); const executions=new MemoryRuntimeExecutionStore(); const registry=new RuntimeRegistry();
  registry.register("preflight",async()=>({evidenceId:"preflight"}));
  registry.register("bank-reconciliation",async()=>{throw new Error("BANK_RECONCILIATION_INCOMPLETE:1");});
  registry.register("ap-validation",async()=>({evidenceId:"ap"})); registry.register("ar-validation",async()=>({evidenceId:"ar"}));
  registry.register("trial-balance",async()=>({evidenceId:"never"})); registry.register("close-analysis",async()=>({evidenceId:"never"}));
    await runs.save(createWorkflowRun("blocked",definition,context));
    let run=await executeReadySteps(definition,"blocked",runs,executions,registry);
    for(let i=0;i<6&&run.status!=="FAILED";i++) run=await executeReadySteps(definition,"blocked",runs,executions,registry);
  expect(run.status).toBe("FAILED"); expect(run.steps["trial-balance"].status).toBe("PENDING");
 });

 it("advances clean prerequisites through trial balance to analysis",async()=>{
  const runs=new MemoryWorkflowRunStore(); const executions=new MemoryRuntimeExecutionStore(); const registry=new RuntimeRegistry();
  for(const id of ["preflight","bank-reconciliation","ap-validation","ar-validation","trial-balance","close-analysis"]) registry.register(id,async()=>({evidenceId:id}));
  await runs.save(createWorkflowRun("clean",definition,context));
  let run=await executeReadySteps(definition,"clean",runs,executions,registry);
  for(let i=0;i<6 && run.steps["close-analysis"].status!=="SUCCEEDED";i++) run=await executeReadySteps(definition,"clean",runs,executions,registry);
  expect(run.steps["trial-balance"].status).toBe("SUCCEEDED"); expect(run.steps["close-analysis"].status).toBe("SUCCEEDED");
  run=await executeReadySteps(definition,"clean",runs,executions,registry);
  expect(run.status).toBe("WAITING_APPROVAL");
 });
});
