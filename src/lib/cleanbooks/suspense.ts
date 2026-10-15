/** B4: identify unresolved suspense postings without modifying journals. */
export type SuspenseLine={id:string;organizationId:string;legalEntityId:string;accountId:string;amountMinor:number;periodLocked:boolean};
export function investigateSuspense(lines:readonly SuspenseLine[],suspenseAccountIds:readonly string[],scope:{organizationId:string;legalEntityId:string}){
 if(!scope.organizationId||!scope.legalEntityId)throw Error("SCOPE_REQUIRED");
 if(lines.some(x=>x.organizationId!==scope.organizationId||x.legalEntityId!==scope.legalEntityId))throw Error("CROSS_SCOPE");
 const suspense=new Set(suspenseAccountIds);
 return lines.filter(x=>suspense.has(x.accountId)).map(x=>({lineId:x.id,amountMinor:x.amountMinor,reason:x.periodLocked?"LOCKED_PERIOD":"SUSPENSE_BALANCE",decision:"REVIEW_REQUIRED" as const}));
}
