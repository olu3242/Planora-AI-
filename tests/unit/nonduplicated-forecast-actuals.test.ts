import {describe,expect,it} from 'vitest';
import {selectNonDuplicatedActuals} from '../../src/domain/forecast/nonduplicated-forecast-actuals';
const source={accountId:'a',currencyCode:'USD',costCenterId:null,sourceMetadata:{origin:'POSTED_LEDGER'}};
const derived={accountId:'a',currencyCode:'USD',costCenterId:'c',sourceMetadata:{origin:'APPROVED_ALLOCATION'}};
describe('forecast actual selection',()=>{
 it('never silently drops a source ledger fact',()=>expect(()=>selectNonDuplicatedActuals([source,derived])).toThrow('FORECAST_ACTUAL_SOURCE_MIX_UNVERIFIED'));
 it('preserves source facts',()=>expect(selectNonDuplicatedActuals([source])).toEqual([source]));
 it('preserves derived facts',()=>expect(selectNonDuplicatedActuals([derived])).toEqual([derived]));
});
