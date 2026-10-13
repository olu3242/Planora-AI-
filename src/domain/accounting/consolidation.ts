import{assertTrialBalance,type TrialBalanceRow}from"./trial-balance";
export type GroupScope=Readonly<{organizationId:string;groupId:string;periodId:string;presentationCurrency:string}>;
export type EntityBalance=Readonly<{entityId:string;accountId:string;currency:string;debitMinor:bigint;creditMinor:bigint;translatedDebitMinor:bigint;translatedCreditMinor:bigint;sourceKey:string}>;
export type Intercompany=Readonly<{reference:string;fromEntityId:string;toEntityId:string;receivableMinor:bigint;payableMinor:bigint;currency:string}>;
export type ConsolidationInput=Readonly<{scope:GroupScope;entities:readonly string[];balances:readonly EntityBalance[];intercompany:readonly Intercompany[];dependencies:Readonly<Record<"C_WAVE"|"D_WAVE"|"E_WAVE"|"F_WAVE","PASS"|"BLOCKED"|"DEFERRED">>;preparedBy:string;approvedBy?:string}>;
export type ConsolidationResult=Readonly<{trialBalance:readonly TrialBalanceRow[];eliminatedMinor:bigint;exceptions:readonly string[];status:"PASS"|"BLOCKED"}>;
function validScope(s:GroupScope){return !!(s.organizationId.trim()&&s.groupId.trim()&&s.periodId.trim()&&/^[A-Z]{3}$/.test(s.presentationCurrency))}
export function consolidate(i:ConsolidationInput):ConsolidationResult{
 const ex:string[]=[];if(!validScope(i.scope)||!i.preparedBy.trim())throw new Error("INVALID_CONSOLIDATION_SCOPE");
 const entities=new Set(i.entities);if(entities.size!==i.entities.length||entities.size<2)throw new Error("INVALID_GROUP_ENTITIES");
 for(const[k,v]of Object.entries(i.dependencies))if(v!=="PASS")ex.push(`${k}_NOT_CERTIFIED`);
 const net=new Map<string,bigint>();for(const b of i.balances){if(!entities.has(b.entityId))ex.push(`ENTITY_OUT_OF_SCOPE:${b.entityId}`);if(!b.sourceKey.trim())ex.push("CONSOLIDATION_LINEAGE_MISSING");if(b.debitMinor<0n||b.creditMinor<0n||b.translatedDebitMinor<0n||b.translatedCreditMinor<0n)throw new Error("INVALID_ENTITY_BALANCE");net.set(b.accountId,(net.get(b.accountId)??0n)+b.translatedDebitMinor-b.translatedCreditMinor)}
 let eliminatedMinor=0n;const refs=new Set<string>();for(const x of i.intercompany){if(refs.has(x.reference))ex.push(`DUPLICATE_INTERCOMPANY_REFERENCE:${x.reference}`);refs.add(x.reference);if(!entities.has(x.fromEntityId)||!entities.has(x.toEntityId)||x.fromEntityId===x.toEntityId)ex.push(`INVALID_INTERCOMPANY_SCOPE:${x.reference}`);if(x.receivableMinor!==x.payableMinor)ex.push(`INTERCOMPANY_MISMATCH:${x.reference}`);else eliminatedMinor+=x.receivableMinor}
 const trialBalance=[...net.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([accountId,n])=>({accountId,debitMinor:n>0n?n:0n,creditMinor:n<0n?-n:0n}));
 try{assertTrialBalance(trialBalance)}catch{ex.push("CONSOLIDATED_TRIAL_BALANCE_OUT_OF_BALANCE")}
 if(!i.approvedBy?.trim())ex.push("CONSOLIDATION_APPROVAL_REQUIRED");else if(i.approvedBy===i.preparedBy)ex.push("SEGREGATION_OF_DUTIES_VIOLATION");
 return{trialBalance,eliminatedMinor,exceptions:[...new Set(ex)].sort(),status:ex.length?"BLOCKED":"PASS"};
}
