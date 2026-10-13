import{ledgerActualGrainKey,staleLedgerActualKeys}from"./actuals-reconciliation";import{projectActualCandidates,type LedgerActual}from"./fpa-bridge";import{calculateActualForecastVariance}from"./variance";
export type FpaScope=Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string;currency:string}>;
export type FpaDependency="C_WAVE"|"D_WAVE"|"E_WAVE"|"F_WAVE"|"G_WAVE";
export type FpaActual=Readonly<{grainKey:string;accountId:string;amountMinor:bigint;sourceKey:string}>;
export type VarianceExplanation=Readonly<{accountId:string;deltaMinor:bigint;evidenceKeys:readonly string[];narrative:string;aiGenerated:boolean}>;
export type FpaConvergence=Readonly<{actuals:readonly FpaActual[];staleKeys:readonly string[];variances:readonly ReturnType<typeof calculateActualForecastVariance>[];status:"PASS"|"BLOCKED";blockers:readonly string[]}>;
export function convergeAccountingToFpa(i:Readonly<{scope:FpaScope;ledger:readonly LedgerActual[];existingActualKeys:readonly string[];forecastByAccount:Readonly<Record<string,bigint>>;dependencies:Readonly<Record<FpaDependency,"PASS"|"BLOCKED"|"DEFERRED">>}>):FpaConvergence{
 const candidates=projectActualCandidates(i.ledger,i.scope);const blockers:string[]=[];for(const[k,v]of Object.entries(i.dependencies))if(v!=="PASS")blockers.push(`${k}_NOT_CERTIFIED`);
 const actuals=candidates.map(a=>({grainKey:ledgerActualGrainKey({organizationId:i.scope.organizationId,legalEntityId:i.scope.legalEntityId,fiscalPeriodId:i.scope.fiscalPeriodId},{currencyCode:i.scope.currency,accountId:a.accountId}),accountId:a.accountId,amountMinor:a.amountMinor,sourceKey:a.sourceKey}));
 const staleKeys=staleLedgerActualKeys({organizationId:i.scope.organizationId,legalEntityId:i.scope.legalEntityId,fiscalPeriodId:i.scope.fiscalPeriodId},actuals.map(a=>({currencyCode:i.scope.currency,accountId:a.accountId})),i.existingActualKeys);
 if(staleKeys.length)blockers.push("STALE_ACTUALS_PRESENT");
 const variances=actuals.map(a=>calculateActualForecastVariance(a.amountMinor,i.forecastByAccount[a.accountId]??0n));
 return{actuals,staleKeys,variances,status:blockers.length?"BLOCKED":"PASS",blockers:[...new Set(blockers)].sort()};
}
export function buildVarianceExplanation(input:Readonly<{accountId:string;actualMinor:bigint;forecastMinor:bigint;evidenceKeys:readonly string[];narrative:string}>):VarianceExplanation{
 if(!input.accountId.trim()||!input.evidenceKeys.length||input.evidenceKeys.some(x=>!x.trim()))throw new Error("EXPLANATION_EVIDENCE_REQUIRED");if(!input.narrative.trim())throw new Error("EXPLANATION_REQUIRED");
 const v=calculateActualForecastVariance(input.actualMinor,input.forecastMinor);return Object.freeze({accountId:input.accountId,deltaMinor:v.deltaMinor,evidenceKeys:[...input.evidenceKeys],narrative:input.narrative,aiGenerated:true});
}
export function assertExplanationMatchesVariance(e:VarianceExplanation,actualMinor:bigint,forecastMinor:bigint):void{if(e.deltaMinor!==calculateActualForecastVariance(actualMinor,forecastMinor).deltaMinor)throw new Error("AI_EXPLANATION_VARIANCE_MISMATCH")}
