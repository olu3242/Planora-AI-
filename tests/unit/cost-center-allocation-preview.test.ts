import { describe, expect, it } from 'vitest';
import { previewCostCenterAllocation } from '../../src/domain/forecast/cost-center-allocation-preview';
const base={organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'ledger:1',amountMinor:101n,shares:[{costCenterId:'x',percentage:'50'},{costCenterId:'y',percentage:'50'}],preparedById:'maker',approvedById:'checker'};
describe('cost-center allocation preview',()=>{
 it('preserves totals and lineage',()=>{const rows=previewCostCenterAllocation(base);expect(rows.reduce((n,r)=>n+r.amountMinor,0n)).toBe(101n);expect(new Set(rows.map(r=>r.allocationKey)).size).toBe(2);});
 it('rejects missing scope',()=>expect(()=>previewCostCenterAllocation({...base,organizationId:''})).toThrow('ALLOCATION_SCOPE_INVALID'));
});
