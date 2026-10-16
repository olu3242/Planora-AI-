import {describe,it,expect} from 'vitest';
import {canPreviewBankReconciliation} from '../../src/domain/accounting/reconciliation-preview-access';
describe('reconciliation preview access',()=>{
 it.each(['CFO','FPA_DIRECTOR'])('permits active %s',role=>expect(canPreviewBankReconciliation(role,true)).toBe(true));
 it.each(['VIEWER','ACCOUNTANT','ADMIN',''])('denies %s',role=>expect(canPreviewBankReconciliation(role,true)).toBe(false));
 it('denies inactive member',()=>expect(canPreviewBankReconciliation('CFO',false)).toBe(false));
});
