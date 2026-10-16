import {describe,expect,it} from 'vitest';
import {verifyLedgerAllocationSource} from '../../src/domain/forecast/verify-ledger-allocation-source';
const scope={organizationId:'o',legalEntityId:'e',fiscalPeriodId:'p',accountId:'a',currencyCode:'USD',sourceIdentifier:'ledger:a'};
const source={...scope,costCenterId:null,amount:'-10.01',sourceMetadata:{origin:'POSTED_LEDGER'}};
describe('posted ledger allocation source',()=>{
 it('returns exact signed minor units',()=>expect(verifyLedgerAllocationSource(source,scope,2)).toBe(-1001n));
 it('rejects mismatched source',()=>expect(()=>verifyLedgerAllocationSource(source,{...scope,sourceIdentifier:'ledger:b'},2)).toThrow('ALLOCATION_LEDGER_SOURCE_SCOPE_MISMATCH'));
 it('rejects non-ledger origin',()=>expect(()=>verifyLedgerAllocationSource({...source,sourceMetadata:{origin:'APPROVED_ALLOCATION'}},scope,2)).toThrow('ALLOCATION_LEDGER_SOURCE_NOT_POSTED'));
 it('rejects pre-dimensioned sources',()=>expect(()=>verifyLedgerAllocationSource({...source,costCenterId:'c'},scope,2)).toThrow('ALLOCATION_LEDGER_SOURCE_ALREADY_DIMENSIONED'));
});
