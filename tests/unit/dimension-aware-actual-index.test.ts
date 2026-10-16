import { describe, expect, it } from 'vitest';
import { indexActualFacts, actualFactKey } from '../../src/domain/forecast/actual-fact-index';
const row=(costCenterId:string|null)=>({accountId:'a',currencyCode:'USD',costCenterId});
describe('dimension aware actual index',()=>{
 it('keeps distinct cost centers',()=>expect(indexActualFacts([row('x'),row('y')]).size).toBe(2));
 it('keeps unallocated separate',()=>expect(indexActualFacts([row(null),row('x')]).size).toBe(2));
 it('rejects duplicate exact grain',()=>expect(()=>indexActualFacts([row('x'),row('x')])).toThrow('DUPLICATE_ACTUAL_FACT_GRAIN'));
 it('looks up exact grain',()=>expect(indexActualFacts([row('x')]).get(actualFactKey(row('x')))).toEqual(row('x')));
});
