import { describe,expect,it } from 'vitest';
import { inspectForecastCoverage } from '../../src/domain/forecast/inspect-forecast-coverage';
const lines=[{id:'line',accountId:'account',costCenterId:'center'}];
describe('pre-variance forecast coverage',()=>{
 it('reports missing actuals',()=>expect(inspectForecastCoverage(lines,[])[0].reason).toBe('ACTUAL_MISSING'));
 it('reports unallocated actuals',()=>expect(inspectForecastCoverage(lines,[{accountId:'account',costCenterId:null,currencyCode:'USD'}])[0].reason).toBe('ACTUAL_UNALLOCATED'));
 it('reports ambiguous currencies',()=>expect(inspectForecastCoverage(lines,[{accountId:'account',costCenterId:'center',currencyCode:'USD'},{accountId:'account',costCenterId:'center',currencyCode:'EUR'}])[0].reason).toBe('ACTUAL_CURRENCY_AMBIGUOUS'));
 it('accepts matching grain',()=>expect(inspectForecastCoverage(lines,[{accountId:'account',costCenterId:'center',currencyCode:'USD'}])).toEqual([]));
});
