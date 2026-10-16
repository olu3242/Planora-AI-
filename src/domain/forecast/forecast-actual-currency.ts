/** Forecast amounts must not be compared against ambiguous currency actuals. */
export function resolveForecastActualCurrency(
  actualCurrencies: readonly string[],
  configuredCurrency?: string | null,
): string | null {
  const currencies = [...new Set(actualCurrencies)];
  if (currencies.some(currency => !/^[A-Z]{3}$/.test(currency))) {
    throw new Error('FORECAST_ACTUAL_CURRENCY_INVALID');
  }
  if (configuredCurrency != null) {
    if (!/^[A-Z]{3}$/.test(configuredCurrency)) throw new Error('FORECAST_CURRENCY_INVALID');
    if (currencies.length && currencies.some(currency => currency !== configuredCurrency)) {
      throw new Error('FORECAST_ACTUAL_CURRENCY_MISMATCH');
    }
    return currencies.length ? configuredCurrency : null;
  }
  if (currencies.length > 1) throw new Error('FORECAST_ACTUAL_CURRENCY_AMBIGUOUS');
  return currencies[0] ?? null;
}
