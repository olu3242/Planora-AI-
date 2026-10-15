/** Deterministic, review-only bookkeeping classification suggestions.
 * No model calls, ledger writes, or autonomous posting.
 */
export type CategorizationRule = Readonly<{
 id:string; organizationId:string; legalEntityId:string; currency?:string;
 keyword:string; accountId:string; active:boolean;
}>;
export type CategorizationInput = Readonly<{
 id:string; organizationId:string; legalEntityId:string; currency:string; description:string;
}>;
export type CategorizationSuggestion = Readonly<{
 transactionId:string; proposedAccountId:string; ruleId:string;
 confidence:"RULE_MATCH"; decision:"REVIEW_REQUIRED";
}>;
export function suggestCategories(
 transactions:readonly CategorizationInput[],
 rules:readonly CategorizationRule[],
 scope:Readonly<{organizationId:string;legalEntityId:string}>,
):CategorizationSuggestion[] {
 if (!scope.organizationId || !scope.legalEntityId) throw new Error("CLEANBOOKS_SCOPE_REQUIRED");
 if ([...transactions,...rules].some(item=>item.organizationId!==scope.organizationId || item.legalEntityId!==scope.legalEntityId)) throw new Error("CLEANBOOKS_CROSS_SCOPE");
 const results:CategorizationSuggestion[]=[];
 for(const t of transactions){
   const description=t.description.trim().toLowerCase();
   if (!description) continue;
   const matches=rules.filter(r=>r.active && r.accountId.trim() && r.keyword.trim() &&
     (!r.currency || r.currency===t.currency) && description.includes(r.keyword.trim().toLowerCase()));
   const uniqueAccounts=new Set(matches.map(r=>r.accountId));
   if(uniqueAccounts.size!==1) continue; // ambiguous mappings must not be suggested
   const rule=matches.slice().sort((a,b)=>a.id.localeCompare(b.id))[0];
   results.push({transactionId:t.id,proposedAccountId:rule.accountId,ruleId:rule.id,confidence:"RULE_MATCH",decision:"REVIEW_REQUIRED"});
 }
 return results;
}
