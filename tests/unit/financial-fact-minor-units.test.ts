import {describe,expect,it} from 'vitest';
import {decimalFromMinorUnits,minorUnitsFromDecimal} from '../../src/domain/forecast/financial-fact-minor-units';
describe('financial fact minor-unit conversion',()=>{
 it('preserves positive and negative amounts',()=>{for(const amount of [0n,1n,-1n,101n,-123456789012345678n])expect(minorUnitsFromDecimal(decimalFromMinorUnits(amount,2),2)).toBe(amount)});
 it('rejects precision loss',()=>expect(()=>minorUnitsFromDecimal('1.234',2)).toThrow('FINANCIAL_FACT_PRECISION_LOSS'));
 it('rejects unsupported scale',()=>expect(()=>decimalFromMinorUnits(1n,7)).toThrow('UNSUPPORTED_FINANCIAL_FACT_PRECISION'));
});
