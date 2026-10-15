/** B101: distinguish empty data sets from a certified complete scan. */
export function scanReadiness(input:{coverageComplete:boolean;accountCount:number;transactionCount:number}){
 if(!Number.isSafeInteger(input.accountCount)||!Number.isSafeInteger(input.transactionCount)||input.accountCount<0||input.transactionCount<0)throw Error("INVALID_SCAN_COUNTS");
 return {status:!input.coverageComplete?"INCOMPLETE":input.accountCount===0?"NO_ACCOUNTS":input.transactionCount===0?"NO_TRANSACTIONS":"READY_FOR_REVIEW",canPost:false as const};
}
