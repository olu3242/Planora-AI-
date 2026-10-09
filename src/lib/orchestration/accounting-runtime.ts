import "server-only";
import { prisma } from "@/lib/prisma";
import { assertTrialBalance, calculateTrialBalance } from "@/domain/accounting/trial-balance";
import { RuntimeRegistry, type StepHandler } from "./runtime";
import { validateBankCloseReadiness, validateApCloseReadiness, validateArCloseReadiness } from "@/application/accounting/close-readiness";
import { closeAccountingPeriod } from "@/application/accounting/close-period";
import { syncLedgerActuals } from "@/application/accounting/sync-actuals";
import { runCloseAgent } from "@/application/agents/close-agent";

function evidence(stepId:string,runId:string){return `workflow:${runId}:${stepId}`;}
const unavailable=(capability:string):StepHandler=>async()=>{throw new Error(`RUNTIME_CAPABILITY_PENDING:${capability}`);};

export function accountingRuntimeRegistry():RuntimeRegistry{
 const registry=new RuntimeRegistry();
 registry.register("preflight",async(run)=>{
  const {organizationId,legalEntityId,fiscalPeriodId}=run.context;
  if(!legalEntityId||!fiscalPeriodId) throw new Error("WORKFLOW_SCOPE_INCOMPLETE");
  const [entity,period]=await Promise.all([
   prisma.legalEntity.findFirst({where:{id:legalEntityId,organizationId,active:true},select:{id:true}}),
   prisma.fiscalPeriod.findFirst({where:{id:fiscalPeriodId,year:{calendar:{organizationId}}},select:{id:true,accountingCloseState:true}}),
  ]);
  if(!entity||!period) throw new Error("WORKFLOW_SCOPE_NOT_IN_TENANT");
  if(period.accountingCloseState==="HARD_CLOSED") throw new Error("PERIOD_ALREADY_HARD_CLOSED");
  return {evidenceId:evidence("preflight",run.id)};
 });
 const scope=(run:Parameters<StepHandler>[0])=>{
  const {organizationId,legalEntityId,fiscalPeriodId}=run.context;
  if(!legalEntityId||!fiscalPeriodId) throw new Error("WORKFLOW_SCOPE_INCOMPLETE");
  return {organizationId,legalEntityId,fiscalPeriodId};
 };
 registry.register("bank-reconciliation",async(run)=>{await validateBankCloseReadiness(scope(run));return {evidenceId:evidence("bank-reconciliation",run.id)};});
 registry.register("ap-validation",async(run)=>{await validateApCloseReadiness(scope(run));return {evidenceId:evidence("ap-validation",run.id)};});
 registry.register("ar-validation",async(run)=>{await validateArCloseReadiness(scope(run));return {evidenceId:evidence("ar-validation",run.id)};});
 registry.register("trial-balance",async(run)=>{
  const {organizationId,legalEntityId,fiscalPeriodId}=run.context;
  if(!legalEntityId||!fiscalPeriodId) throw new Error("WORKFLOW_SCOPE_INCOMPLETE");
  const journals=await prisma.accountingJournal.findMany({where:{organizationId,legalEntityId,fiscalPeriodId,status:"POSTED"},select:{lines:{select:{accountId:true,debitMinor:true,creditMinor:true}}}});
  const rows=calculateTrialBalance(journals.flatMap(j=>j.lines));
  assertTrialBalance(rows);
  return {evidenceId:evidence("trial-balance",run.id)};
 });
 registry.register("close-analysis",async(run)=>{
  const s=scope(run);
  const result=await runCloseAgent({...s,actorId:run.context.actorId,correlationId:run.context.correlationId});
  return {evidenceId:`agent-recommendation:${result.recommendationId}`};
 });
 registry.register("period-close",async(run)=>{
  const s=scope(run);
  await closeAccountingPeriod({organizationId:s.organizationId,fiscalPeriodId:s.fiscalPeriodId,actorId:run.context.actorId,correlationId:run.context.correlationId});
  return {evidenceId:evidence("period-close",run.id)};
 });
 registry.register("actuals-sync",async(run)=>{
  const s=scope(run);
  await syncLedgerActuals({...s,actorId:run.context.actorId,correlationId:run.context.correlationId});
  return {evidenceId:evidence("actuals-sync",run.id)};
 });
 registry.register("forecast-refresh",unavailable("forecast-refresh-agent"));
 registry.register("insight-generation",unavailable("insight-agent"));
 return registry;
}
