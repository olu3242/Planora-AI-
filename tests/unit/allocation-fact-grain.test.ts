import {describe,expect,it} from 'vitest';
import {allocationFactGrain} from '../../src/domain/forecast/allocation-fact-grain';
describe('derived allocation identity',()=>{
 it('is stable across retries',()=>expect(allocationFactGrain({ruleId:'r',allocationKey:'k'})).toBe(allocationFactGrain({ruleId:'r',allocationKey:'k'})));
 it('isolates distinct rules',()=>expect(allocationFactGrain({ruleId:'r1',allocationKey:'k'})).not.toBe(allocationFactGrain({ruleId:'r2',allocationKey:'k'})));
 it('rejects missing identity',()=>expect(()=>allocationFactGrain({ruleId:'',allocationKey:'k'})).toThrow('ALLOCATION_FACT_IDENTITY_MISSING'));
});
