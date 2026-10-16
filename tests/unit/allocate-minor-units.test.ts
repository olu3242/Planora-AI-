import { describe, expect, it } from 'vitest';
import { allocateMinorUnits } from '../../src/domain/forecast/allocate-minor-units';
const shares=[{costCenterId:'a',percentage:'50'},{costCenterId:'b',percentage:'50'}];
describe('minor unit allocation',()=>{
 it('preserves positive amount exactly',()=>expect(allocateMinorUnits(101n,shares,'maker','checker').reduce((n,r)=>n+r.amountMinor,0n)).toBe(101n));
 it('preserves negative amount exactly',()=>expect(allocateMinorUnits(-101n,shares,'maker','checker').reduce((n,r)=>n+r.amountMinor,0n)).toBe(-101n));
 it('preserves zero',()=>expect(allocateMinorUnits(0n,shares,'maker','checker').reduce((n,r)=>n+r.amountMinor,0n)).toBe(0n));
 it('rejects non-independent approval',()=>expect(()=>allocateMinorUnits(100n,shares,'maker','maker')).toThrow());
});
