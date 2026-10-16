import { forecastActualOrigin } from './forecast-actual-origin';
export type ForecastSourceFact = Readonly<{
 accountId:string;currencyCode:string;costCenterId:string|null;sourceMetadata:unknown;
}>;
export function selectNonDuplicatedActuals<T extends ForecastSourceFact>(facts:readonly T[]):T[] {
 const allocated=new Set(facts.filter(f=>forecastActualOrigin(f.sourceMetadata)==='APPROVED_ALLOCATION').map(f=>JSON.stringify([f.accountId,f.currencyCode])));
 return facts.filter(f=>!(f.costCenterId===null && forecastActualOrigin(f.sourceMetadata)==='POSTED_LEDGER' && allocated.has(JSON.stringify([f.accountId,f.currencyCode]))));
}
