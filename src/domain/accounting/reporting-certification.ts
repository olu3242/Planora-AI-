import { buildFinancialStatements, type FinancialStatementSet, type StatementAccount } from "./financial-statements";
import { projectActualCandidates, type LedgerActual } from "./fpa-bridge";
import { calculateActualForecastVariance } from "./variance";

export type ReportingScope = Readonly<{ organizationId:string; legalEntityId:string; fiscalPeriodId:string; currency:string }>;
export type CloseEvidence = Readonly<{ dWaveStatus:"PASS"|"BLOCKED"; cWaveStatus:"PASS"|"DEFERRED"|"BLOCKED"; controllerApproved:boolean; approvedBy?:string }>;
export type ReportingPackage = Readonly<{
  scope:ReportingScope; statements:FinancialStatementSet;
  actuals:ReturnType<typeof projectActualCandidates>;
  variances:readonly Readonly<{accountId:string;actualMinor:bigint;forecastMinor:bigint;deltaMinor:bigint;direction:"ABOVE"|"BELOW"|"ON_TARGET"}>[];
  status:"DRAFT"|"READY_FOR_REVIEW"|"BLOCKED";
  blockers:readonly string[];
}>;

function assertScope(scope:ReportingScope):void {
  if(!scope.organizationId.trim()||!scope.legalEntityId.trim()||!scope.fiscalPeriodId.trim()||!/^[A-Z]{3}$/.test(scope.currency)) throw new Error("INVALID_REPORTING_SCOPE");
}

export function buildReportingPackage(input:Readonly<{
 scope:ReportingScope; accounts:readonly StatementAccount[]; ledger:readonly LedgerActual[];
 forecastByAccount:Readonly<Record<string,bigint>>; close:CloseEvidence;
}>):ReportingPackage {
 assertScope(input.scope);
 const statements=buildFinancialStatements(input.accounts);
 const actuals=projectActualCandidates(input.ledger,input.scope);
 const blockers:string[]=[];
 if(input.close.dWaveStatus!=="PASS") blockers.push("D_WAVE_NOT_CERTIFIED");
 if(input.close.cWaveStatus!=="PASS") blockers.push("C_WAVE_NOT_CERTIFIED");
 if(!statements.controls.trialBalanceBalanced) blockers.push("TRIAL_BALANCE_OUT_OF_BALANCE");
 if(!statements.controls.balanceSheetBalanced) blockers.push("BALANCE_SHEET_OUT_OF_BALANCE");
 if(!statements.controls.cashFlowClassified) blockers.push("CASH_FLOW_UNCLASSIFIED");
 if(!input.close.controllerApproved||!input.close.approvedBy?.trim()) blockers.push("CONTROLLER_APPROVAL_REQUIRED");
 const variances=actuals.map(a=>{const v=calculateActualForecastVariance(a.amountMinor,input.forecastByAccount[a.accountId]??0n);return {accountId:a.accountId,actualMinor:v.actualMinor,forecastMinor:v.forecastMinor,deltaMinor:v.deltaMinor,direction:v.direction};});
 return {scope:Object.freeze({...input.scope}),statements,actuals,variances,status:blockers.length?"BLOCKED":"READY_FOR_REVIEW",blockers};
}

export function assertReportingLineage(pkg:ReportingPackage):void {
 const prefix=["ledger",pkg.scope.organizationId,pkg.scope.legalEntityId,pkg.scope.fiscalPeriodId,pkg.scope.currency].join(":")+":";
 if(pkg.actuals.some(a=>!a.sourceKey.startsWith(prefix))) throw new Error("REPORTING_LINEAGE_MISMATCH");
}

export function lockReportingPackage(pkg:ReportingPackage,actorId:string):Readonly<{status:"LOCKED";lockedBy:string;package:ReportingPackage}> {
 if(pkg.status!=="READY_FOR_REVIEW") throw new Error("REPORTING_PACKAGE_NOT_READY");
 if(!actorId.trim()) throw new Error("LOCK_ACTOR_REQUIRED");
 assertReportingLineage(pkg);
 return Object.freeze({status:"LOCKED",lockedBy:actorId,package:pkg});
}
