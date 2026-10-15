/** B9: UI-ready aggregate; consumes authorized, already-scoped findings. */
export function summarizeCleanBooks(input:{scanned:number;profileExceptions:number;duplicateCandidates:number;suspenseItems:number;reconciliationUnmatched:number;overdueItems:number;integrityExceptions:number;coverageComplete:boolean}){
 if(Object.values(input).some(v=>typeof v==="number"&&(!Number.isSafeInteger(v)||v<0)))throw Error("INVALID_COUNTS");
 const openFindings=input.profileExceptions+input.duplicateCandidates+input.suspenseItems+input.reconciliationUnmatched+input.overdueItems+input.integrityExceptions;
 return {...input,openFindings,readiness:!input.coverageComplete?"INCOMPLETE":openFindings>0?"REVIEW_REQUIRED":"READY_FOR_CONTROLLER_REVIEW",canClose:false as const,canPost:false as const};
}
