import { assertForecastActualProvenance } from './forecast-actual-provenance';
export type ForecastSourceFact = Readonly<{
 accountId:string;currencyCode:string;costCenterId:string|null;sourceMetadata:unknown;
}>;
/** Never discard ledger rows based solely on the presence of derived facts. */
export function selectNonDuplicatedActuals<T extends ForecastSourceFact>(facts:readonly T[]):T[] {
 assertForecastActualProvenance(facts);
 return [...facts];
}
