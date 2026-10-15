/** B6: flag aging AP/AR items for review; never settles balances. */
export type OpenItem={id:string;organizationId:string;legalEntityId:string;kind:"AP"|"AR";dueDate:string;outstandingMinor:number;status:"OPEN"|"SETTLED"};
export function inspectOpenItems(items:readonly OpenItem[],scope:{organizationId:string;legalEntityId:string},asOf:string){
 if(items.some(x=>x.organizationId!==scope.organizationId||x.legalEntityId!==scope.legalEntityId))throw Error("CROSS_SCOPE");
 const date=new Date(asOf+"T00:00:00Z");if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==asOf)throw Error("INVALID_AS_OF");
 return items.filter(x=>x.status==="OPEN"&&Number.isSafeInteger(x.outstandingMinor)&&x.outstandingMinor>0).map(x=>{
  const due=new Date(x.dueDate+"T00:00:00Z");const days=Number.isNaN(due.getTime())?null:Math.max(0,Math.floor((date.getTime()-due.getTime())/86400000));
  return {itemId:x.id,kind:x.kind,daysOverdue:days,flag:days===null?"INVALID_DUE_DATE":days>0?"OVERDUE":"CURRENT",decision:"REVIEW_REQUIRED" as const};
 });
}
