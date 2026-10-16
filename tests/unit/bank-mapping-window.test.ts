import {describe,it,expect} from 'vitest';
import {bankMappingWindowsOverlap as overlap} from '../../src/domain/accounting/bank-mapping-window';
const d=(s:string)=>new Date(s+'T00:00:00Z');
describe('bank mapping overlap',()=>{
 it('overlaps at inclusive boundary',()=>expect(overlap({from:d('2026-01-01'),to:d('2026-02-01')},{from:d('2026-02-01'),to:d('2026-03-01')})).toBe(true));
 it('allows nonoverlapping windows',()=>expect(overlap({from:d('2026-01-01'),to:d('2026-01-31')},{from:d('2026-02-01'),to:null})).toBe(false));
 it('overlaps unbounded periods',()=>expect(overlap({from:d('2026-01-01'),to:null},{from:d('2026-06-01'),to:null})).toBe(true));
 it('rejects inverted periods',()=>expect(overlap({from:d('2026-03-01'),to:d('2026-02-01')},{from:d('2026-01-01'),to:null})).toBe(false));
});
