import { describe, expect, it } from 'vitest';
import { actualGrainKey } from '../../src/domain/forecast/actual-grain-key';
describe('actual grain', () => {
 it('separates cost centers', () => expect(actualGrainKey({accountId:'a',currencyCode:'USD',costCenterId:'x'})).not.toBe(actualGrainKey({accountId:'a',currencyCode:'USD',costCenterId:'y'})));
 it('separates unallocated actuals', () => expect(actualGrainKey({accountId:'a',currencyCode:'USD',costCenterId:null})).not.toBe(actualGrainKey({accountId:'a',currencyCode:'USD',costCenterId:'x'})));
});
