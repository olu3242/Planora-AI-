import {describe,expect,it} from 'vitest';
import {assertForecastAllocationCertification} from '../../src/domain/forecast/assert-forecast-allocation-certification';
const fact={accountId:'a',currencyCode:'USD',costCenterId:'c',sourceIdentifier:'s',sourceMetadata:{origin:'APPROVED_ALLOCATION',ruleId:'r',allocationKey:'k'}};
describe('forecast allocation certification gate',()=>{
 it('rejects uncertified derived facts',()=>expect(()=>assertForecastAllocationCertification([fact])).toThrow('FORECAST_ALLOCATION_CERTIFICATION_REQUIRED'));
 it('rejects incomplete lineage',()=>expect(()=>assertForecastAllocationCertification([{...fact,sourceMetadata:{origin:'APPROVED_ALLOCATION'}}])).toThrow('FORECAST_ALLOCATION_LINEAGE_INCOMPLETE'));
 it('permits posted-ledger-only inputs',()=>expect(()=>assertForecastAllocationCertification([{...fact,costCenterId:null,sourceMetadata:{origin:'POSTED_LEDGER'}}])).not.toThrow());
});
