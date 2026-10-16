import { describe, expect, it } from 'vitest';
import { forecastCoverageException } from '../../src/domain/forecast/forecast-coverage-exception';
const base = {lineId:'line',accountId:'account',costCenterId:'cc',actualCostCenters:[] as (string|null)[],actualCurrencies:[] as string[]};
describe('forecast coverage exceptions',()=>{
 it('flags absent actuals',()=>expect(forecastCoverageException(base)?.reason).toBe('ACTUAL_MISSING'));
 it('flags unallocated actuals',()=>expect(forecastCoverageException({...base,actualCostCenters:[null],actualCurrencies:['USD']})?.reason).toBe('ACTUAL_UNALLOCATED'));
 it('flags mixed currencies',()=>expect(forecastCoverageException({...base,actualCostCenters:['cc'],actualCurrencies:['USD','EUR']})?.reason).toBe('ACTUAL_CURRENCY_AMBIGUOUS'));
 it('accepts exact matching cost center',()=>expect(forecastCoverageException({...base,actualCostCenters:['cc'],actualCurrencies:['USD']})).toBeNull());
});
