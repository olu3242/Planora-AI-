/** B8: scoped GL integrity checks on exact integer minor units. */
export type LedgerLine={id:string;organizationId:string;legalEntityId:string;journalId:string;debitMinor:number;creditMinor:number};
export function checkLedgerIntegrity(lines:readonly LedgerLine[],scope:{organizationId:string;legalEntityId:string}){
 if(lines.some(l=>l.organizationId!==scope.organizationId||l.legalEntityId!==scope.legalEntityId))throw Error("CROSS_SCOPE");
 const grouped=new Map<string,{debit:bigint;credit:bigint;invalid:boolean}>();
 for(const l of lines){const g=grouped.get(l.journalId)??{debit:0n,credit:0n,invalid:false};if(!Number.isSafeInteger(l.debitMinor)||!Number.isSafeInteger(l.creditMinor)||l.debitMinor<0||l.creditMinor<0||(l.debitMinor>0&&l.creditMinor>0))g.invalid=true;else{g.debit+=BigInt(l.debitMinor);g.credit+=BigInt(l.creditMinor)}grouped.set(l.journalId,g)}
 const exceptions=[...grouped].filter(([,g])=>g.invalid||g.debit!==g.credit||g.debit===0n).map(([journalId,g])=>({journalId,code:g.invalid?"INVALID_LINE":"UNBALANCED_OR_EMPTY",decision:"REVIEW_REQUIRED" as const}));
 return {journalsScanned:grouped.size,exceptions,balanced:exceptions.length===0,canPost:false as const};
}
