import { describe, expect, it } from 'vitest';
import { assertForecastDimensionCompatibility } from '../../src/domain/forecast/forecast-dimension-compatibility';
describe('forecast cost-center grain',()=>{
 it('accepts matching cost center',()=>expect(()=>assertForecastDimensionCompatibility({forecastCostCenterId:'cc',actualCostCenterId:'cc'})).not.toThrow());
 it('rejects unallocated actual',()=>expect(()=>assertForecastDimensionCompatibility({forecastCostCenterId:'cc',actualCostCenterId:null})).toThrow('FORECAST_ACTUAL_COST_CENTER_MISMATCH'));
 it('rejects different cost center',()=>expect(()=>assertForecastDimensionCompatibility({forecastCostCenterId:'cc',actualCostCenterId:'other'})).toThrow());
});
