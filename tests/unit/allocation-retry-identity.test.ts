import {describe,expect,it} from 'vitest';
import {assertAllocationRetryIdentity} from '../../src/domain/forecast/allocation-retry-identity';
const row={grainKey:'g',organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',costCenterId:'c',sourceIdentifier:'s'};
describe('allocation retry identity',()=>{
 it('accepts exact identity',()=>expect(()=>assertAllocationRetryIdentity(row,row)).not.toThrow());
 it('rejects mismatched accounting dimension',()=>expect(()=>assertAllocationRetryIdentity(row,{...row,costCenterId:'other'})).toThrow('ALLOCATION_RETRY_IDENTITY_CONFLICT'));
 it('rejects mismatched tenant',()=>expect(()=>assertAllocationRetryIdentity(row,{...row,organizationId:'other'})).toThrow('ALLOCATION_RETRY_IDENTITY_CONFLICT'));
});
