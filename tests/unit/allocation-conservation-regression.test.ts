import { describe, expect, it } from 'vitest';
import { allocateMinorUnits } from '../../src/domain/forecast/allocate-minor-units';
describe('allocation conservation regression',()=>{
 const shares=[{costCenterId:'cc1',percentage:'33.33'},{costCenterId:'cc2',percentage:'33.33'},{costCenterId:'cc3',percentage:'33.34'}];
 for(const value of [0n,1n,2n,100n,101n,-1n,-101n,1000000000000000n]){
  it('preserves '+value.toString()+' minor units',()=>{
   const result=allocateMinorUnits(value,shares,'maker','checker');
   expect(result.reduce((sum,row)=>sum+row.amountMinor,0n)).toBe(value);
  });
 }
});
