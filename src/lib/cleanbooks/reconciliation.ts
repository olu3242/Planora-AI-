/** Read-only bank-to-journal candidate matching. Never marks a transaction reconciled. */
export type BankRow={id:string;organizationId:string;legalEntityId:string;currency:string;amountMinor:number;bookedAt:string;reference:string};
export type JournalRow=BankRow & {posted:boolean;locked:boolean};
export function proposeReconciliation(banks:readonly BankRow[],journals:readonly JournalRow[],scope:{organizationId:string;legalEntityId:string}){
 if(!scope.organizationId||!scope.legalEntityId)throw Error("SCOPE_REQUIRED");
 if([...banks,...journals].some(x=>x.organizationId!==scope.organizationId||x.legalEntityId!==scope.legalEntityId))throw Error("CROSS_SCOPE");
 const used=new Set<string>();const matches:{bankId:string;journalId:string;decision:"REVIEW_REQUIRED"}[]=[];
 for(const b of banks){
  if(!Number.isSafeInteger(b.amountMinor))continue;
  const eligible=journals.filter(j=>j.posted&&!j.locked&&!used.has(j.id)&&j.currency===b.currency&&j.amountMinor===b.amountMinor&&j.bookedAt===b.bookedAt&&j.reference.trim().toLowerCase()===b.reference.trim().toLowerCase());
  if(eligible.length!==1)continue;
  used.add(eligible[0].id);matches.push({bankId:b.id,journalId:eligible[0].id,decision:"REVIEW_REQUIRED"});
 }
 return {matches,unmatchedBankIds:banks.filter(b=>!matches.some(m=>m.bankId===b.id)).map(b=>b.id),canPost:false as const};
}
