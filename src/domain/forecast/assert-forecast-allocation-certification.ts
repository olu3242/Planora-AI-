import {forecastActualOrigin} from './forecast-actual-origin';
export type ForecastAllocationCandidate=Readonly<{accountId:string;currencyCode:string;costCenterId:string|null;sourceIdentifier:string;sourceMetadata:unknown}>;
/** Derived actuals must not enter forecast variance analysis without certified reconciliation. */
export function assertForecastAllocationCertification(facts:readonly ForecastAllocationCandidate[]):void{
 for(const fact of facts){
  if(forecastActualOrigin(fact.sourceMetadata)!=='APPROVED_ALLOCATION')continue;
  const meta=fact.sourceMetadata as Record<string,unknown>;
  if(!fact.costCenterId||!fact.sourceIdentifier||typeof meta.ruleId!=='string'||!meta.ruleId||typeof meta.allocationKey!=='string'||!meta.allocationKey)throw new Error('FORECAST_ALLOCATION_LINEAGE_INCOMPLETE');
  throw new Error('FORECAST_ALLOCATION_CERTIFICATION_REQUIRED');
 }
}
