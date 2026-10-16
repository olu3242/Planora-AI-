import { describe,expect,it } from 'vitest';
import { assertForecastActualProvenance } from '../../src/domain/forecast/forecast-actual-provenance';
const fact=(accountId:string,origin:string)=>({accountId,currencyCode:'USD',costCenterId:origin==='POSTED_LEDGER'?null:'c',sourceMetadata:{origin}});
describe('forecast provenance account isolation',()=>{
 it('does not confuse separate accounts',()=>expect(()=>assertForecastActualProvenance([fact('a','POSTED_LEDGER'),fact('b','APPROVED_ALLOCATION')])).not.toThrow());
 it('rejects same-account mixtures',()=>expect(()=>assertForecastActualProvenance([fact('a','POSTED_LEDGER'),fact('a','APPROVED_ALLOCATION')])).toThrow());
});
