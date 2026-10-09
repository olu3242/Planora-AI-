import "server-only";
import { prisma } from "@/lib/prisma";
import { assertTrialBalance, calculateTrialBalance } from "@/domain/accounting/trial-balance";
import { RuntimeRegistry, type StepHandler } from "./runtime";

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
 registry.register("bank-reconciliation",unavailable("bank-reconciliation-persistence"));
 registry.register("ap-validation",unavailable("ap-persistence"));
 registry.register("ar-validation",unavailable("ar-persistence"));
 registry.register("trial-balance",async(run)=>{
  const {organizationId,legalEntityId,fiscalPeriodId}=run.context;
  if(!legalEntityId||!fiscalPeriodId) throw new Error("WORKFLOW_SCOPE_INCOMPLETE");
  const journals=await prisma.accountingJournal.findMany({where:{organizationId,legalEntityId,fiscalPeriodId,status:"POSTED"},select:{lines:{select:{accountId:true,debitMinor:true,creditMinor:true}}}});
  const rows=calculateTrialBalance(journals.flatMap(j=>j.lines));
  assertTrialBalance(rows);
  return {evidenceId:evidence("trial-balance",run.id)};
 });
 registry.register("close-analysis",unavailable("close-agent"));
 registry.register("period-close",unavailable("period-close-transaction"));
 registry.register("actuals-sync",unavailable("financial-fact-ledger-sync"));
 registry.register("forecast-refresh",unavailable("forecast-refresh-agent"));
 registry.register("insight-generation",unavailable("insight-agent"));
 return registry;
}
