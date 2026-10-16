import { describe, expect, it } from 'vitest';
import { validateLedgerToFpaLineage } from '../../src/domain/accounting/ledger-to-fpa-lineage';
const base = { organizationId:'org', legalEntityId:'entity', fiscalPeriodId:'period', journalId:'journal', accountId:'account', currencyCode:'USD', sourceType:'POSTED_LEDGER' as const, bankEvidenceCount:0 };
describe('ledger to FP&A lineage',()=>{
 it('allows zero bank evidence for valid posted journal lineage',()=>expect(validateLedgerToFpaLineage(base)).toBe(true));
 it('rejects invalid evidence counts',()=>expect(validateLedgerToFpaLineage({...base,bankEvidenceCount:-1})).toBe(false));
 it('rejects missing fiscal scope',()=>expect(validateLedgerToFpaLineage({...base,fiscalPeriodId:''})).toBe(false));
});
