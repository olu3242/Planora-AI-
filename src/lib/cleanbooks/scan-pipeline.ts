import { profileTransactions, type CleanupTransaction } from "./profile-transactions";
import { findDuplicateCandidates } from "./duplicate-candidates";
import { summarizeCleanBooks } from "./dashboard";
import { requireScope, assertScoped, type Scope } from "./b10-scope";

/** Pure B1/B2/B9/B10 orchestration for repeatable E2E contract testing. */
export function assembleCleanBooksScan(transactions:readonly CleanupTransaction[],scope:Scope,coverageComplete:boolean){
 requireScope(scope);assertScoped(transactions,scope);
 const profile=profileTransactions(transactions,scope);
 const duplicates=findDuplicateCandidates(transactions,scope);
 const dashboard=summarizeCleanBooks({
  scanned:profile.scanned,profileExceptions:profile.exceptions.length,
  duplicateCandidates:duplicates.length,suspenseItems:0,reconciliationUnmatched:0,
  overdueItems:0,integrityExceptions:0,coverageComplete
 });
 return {profile,duplicates,dashboard,decision:"REVIEW_REQUIRED" as const,canPost:false as const};
}
