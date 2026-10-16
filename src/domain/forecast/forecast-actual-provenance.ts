import { forecastActualOrigin } from './forecast-actual-origin';
export type ActualProvenance = Readonly<{accountId:string;currencyCode:string;costCenterId:string|null;sourceMetadata:unknown}>;
/** Reject source and derived fact mixtures until source-level reconciliation is certified. */
export function assertForecastActualProvenance(facts:readonly ActualProvenance[]):void {
 const origins=new Map<string,Set<string>>();
 for(const fact of facts){
  const key=JSON.stringify([fact.accountId,fact.currencyCode]);
  const set=origins.get(key)??new Set<string>();
  set.add(forecastActualOrigin(fact.sourceMetadata));
  origins.set(key,set);
 }
 for(const set of origins.values()){
  if(set.has('APPROVED_ALLOCATION')&&set.has('POSTED_LEDGER'))throw new Error('FORECAST_ACTUAL_SOURCE_MIX_UNVERIFIED');
 }
}
