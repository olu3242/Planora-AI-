import { describe, expect, it } from 'vitest';
import { validateApprovedAllocation } from '../../src/domain/forecast/approved-allocation-policy';
describe('allocation approval policy', () => {
 it('accepts independent approval with balanced shares', () => expect(() => validateApprovedAllocation([{costCenterId:'a',percentage:'60'},{costCenterId:'b',percentage:'40'}],'maker','checker')).not.toThrow());
 it('rejects self approval', () => expect(() => validateApprovedAllocation([{costCenterId:'a',percentage:'100'}],'maker','maker')).toThrow());
 it('rejects unbalanced shares', () => expect(() => validateApprovedAllocation([{costCenterId:'a',percentage:'99'}],'maker','checker')).toThrow());
});
