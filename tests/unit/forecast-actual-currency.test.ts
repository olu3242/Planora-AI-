import { describe, expect, it } from 'vitest';
import { resolveForecastActualCurrency } from '../../src/domain/forecast/forecast-actual-currency';
describe('forecast actual currency', () => {
 it('accepts one currency',()=>expect(resolveForecastActualCurrency(['USD','USD'])).toBe('USD'));
 it('rejects multiple currencies',()=>expect(()=>resolveForecastActualCurrency(['USD','EUR'])).toThrow('FORECAST_ACTUAL_CURRENCY_AMBIGUOUS'));
 it('rejects configured currency mismatch',()=>expect(()=>resolveForecastActualCurrency(['USD'],'EUR')).toThrow('FORECAST_ACTUAL_CURRENCY_MISMATCH'));
 it('does not invent currency for missing actuals',()=>expect(resolveForecastActualCurrency([])).toBeNull());
});
