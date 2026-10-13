export type CloseState="OPEN"|"IN_PROGRESS"|"WAITING_APPROVAL"|"HARD_CLOSED"|"REOPENED";
export type CloseDependency="C_WAVE"|"D_WAVE"|"E_WAVE";
export type CloseTaskId="BANK_RECONCILIATION"|"AP_RECONCILIATION"|"AR_RECONCILIATION"|"TRIAL_BALANCE"|"STATEMENTS"|"FPA_ACTUALS";
export type CloseTask=Readonly<{id:CloseTaskId;status:"PENDING"|"COMPLETE"|"BLOCKED";evidence?:string}>;
export type CloseRun=Readonly<{organizationId:string;legalEntityId:string;periodId:string;state:CloseState;tasks:readonly CloseTask[];dependencies:Readonly<Record<CloseDependency,"PASS"|"BLOCKED"|"DEFERRED">>;preparedBy:string;approvedBy?:string;reopenReason?:string}>;

export function startClose(input:Omit<CloseRun,"state"|"approvedBy"|"reopenReason">):CloseRun{
 if(!input.organizationId.trim()||!input.legalEntityId.trim()||!input.periodId.trim()||!input.preparedBy.trim())throw new Error("INVALID_CLOSE_SCOPE");
 return Object.freeze({...input,state:"IN_PROGRESS"});
}
export function closeBlockers(run:CloseRun):string[]{
 const b:string[]=[];
 for(const [k,v] of Object.entries(run.dependencies))if(v!=="PASS")b.push(`${k}_NOT_CERTIFIED`);
 for(const t of run.tasks){if(t.status!=="COMPLETE")b.push(`TASK_${t.id}_${t.status}`);else if(!t.evidence?.trim())b.push(`TASK_${t.id}_EVIDENCE_REQUIRED`);}
 return b.sort();
}
export function requestCloseApproval(run:CloseRun):CloseRun{
 if(run.state!=="IN_PROGRESS")throw new Error("CLOSE_NOT_IN_PROGRESS");
 if(closeBlockers(run).length)throw new Error("CLOSE_PREREQUISITES_INCOMPLETE");
 return Object.freeze({...run,state:"WAITING_APPROVAL"});
}
export function approveAndHardClose(run:CloseRun,approverId:string):CloseRun{
 if(run.state!=="WAITING_APPROVAL")throw new Error("CLOSE_NOT_WAITING_APPROVAL");
 if(!approverId.trim())throw new Error("APPROVER_REQUIRED");
 if(approverId===run.preparedBy)throw new Error("SEGREGATION_OF_DUTIES_VIOLATION");
 if(closeBlockers(run).length)throw new Error("CLOSE_PREREQUISITES_INCOMPLETE");
 return Object.freeze({...run,state:"HARD_CLOSED",approvedBy:approverId});
}
export function assertPeriodPostingAllowed(run:CloseRun):void{
 if(run.state==="HARD_CLOSED")throw new Error("PERIOD_NOT_OPEN");
}
export function reopenPeriod(run:CloseRun,input:Readonly<{actorId:string;reason:string;authorized:boolean}>):CloseRun{
 if(run.state!=="HARD_CLOSED")throw new Error("PERIOD_NOT_HARD_CLOSED");
 if(!input.authorized)throw new Error("REOPEN_NOT_AUTHORIZED");
 if(!input.actorId.trim()||!input.reason.trim())throw new Error("REOPEN_EVIDENCE_REQUIRED");
 if(input.actorId===run.preparedBy)throw new Error("SEGREGATION_OF_DUTIES_VIOLATION");
 return Object.freeze({...run,state:"REOPENED",reopenReason:input.reason});
}
export function certifyClose(run:CloseRun):Readonly<{status:"PASS"|"BLOCKED";blockers:readonly string[]}>{
 const blockers=closeBlockers(run);
 if(run.state!=="HARD_CLOSED")blockers.push("PERIOD_NOT_HARD_CLOSED");
 if(!run.approvedBy?.trim())blockers.push("CONTROLLER_APPROVAL_MISSING");
 return {status:blockers.length?"BLOCKED":"PASS",blockers:[...new Set(blockers)].sort()};
}
