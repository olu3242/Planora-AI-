import { describe,expect,it } from 'vitest';
import { assertForecastActualProvenance } from '../../src/domain/forecast/forecast-actual-provenance';
const fact=(origin:string)=>({accountId:'a',currencyCode:'USD',costCenterId:origin==='POSTED_LEDGER'?null:'c',sourceMetadata:{origin}});
describe('forecast provenance guard',()=>{
 it('rejects mixed source and derived facts',()=>expect(()=>assertForecastActualProvenance([fact('POSTED_LEDGER'),fact('APPROVED_ALLOCATION')])).toThrow('FORECAST_ACTUAL_SOURCE_MIX_UNVERIFIED'));
 it('accepts source only',()=>expect(()=>assertForecastActualProvenance([fact('POSTED_LEDGER')])).not.toThrow());
 it('accepts derived only',()=>expect(()=>assertForecastActualProvenance([fact('APPROVED_ALLOCATION')])).not.toThrow());
});
