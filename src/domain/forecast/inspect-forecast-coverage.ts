import { forecastCoverageException, type ForecastCoverageException } from './forecast-coverage-exception';
export type ForecastCoverageLine = Readonly<{id:string;accountId:string;costCenterId:string}>;
export type ForecastCoverageActual = Readonly<{accountId:string;costCenterId:string|null;currencyCode:string}>;
/** Inspect coverage before any variance calculation or currency resolution. */
export function inspectForecastCoverage(lines:readonly ForecastCoverageLine[],actuals:readonly ForecastCoverageActual[]):ForecastCoverageException[]{
 return lines.flatMap(line=>{
  const matching=actuals.filter(actual=>actual.accountId===line.accountId);
  const exception=forecastCoverageException({lineId:line.id,accountId:line.accountId,costCenterId:line.costCenterId,actualCostCenters:matching.map(a=>a.costCenterId),actualCurrencies:matching.map(a=>a.currencyCode)});
  return exception?[exception]:[];
 });
}
