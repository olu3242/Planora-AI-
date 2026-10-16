import {describe,expect,it} from 'vitest';
import {forecastActualOrigin} from '../../src/domain/forecast/forecast-actual-origin';
describe('forecast source provenance',()=>{
 it('identifies ledger origin',()=>expect(forecastActualOrigin({origin:'POSTED_LEDGER'})).toBe('POSTED_LEDGER'));
 it('identifies allocation origin',()=>expect(forecastActualOrigin({origin:'APPROVED_ALLOCATION'})).toBe('APPROVED_ALLOCATION'));
 it('does not trust missing metadata',()=>expect(forecastActualOrigin(null)).toBe('UNKNOWN'));
});
