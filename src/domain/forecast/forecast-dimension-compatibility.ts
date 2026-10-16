/** Prevent account-only joins from silently combining cost-center-specific forecast lines. */
export function assertForecastDimensionCompatibility(input: Readonly<{
  forecastCostCenterId: string;
  actualCostCenterId: string | null;
}>): void {
  if (!input.forecastCostCenterId.trim()) throw new Error('FORECAST_COST_CENTER_REQUIRED');
  if (input.actualCostCenterId !== input.forecastCostCenterId) {
    throw new Error('FORECAST_ACTUAL_COST_CENTER_MISMATCH');
  }
}
