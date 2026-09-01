import { money, type DecimalInput } from "@/domain/financial/money";

export function calculateVariance(actual: DecimalInput, forecast: DecimalInput) {
  const actualValue = money(actual); const forecastValue = money(forecast); const amount = actualValue.minus(forecastValue);
  return { amount, percentage: forecastValue.isZero() ? money(0) : amount.div(forecastValue.abs()).mul(100) };
}

export function calculateMovement(current: DecimalInput, prior: DecimalInput) {
  const currentValue = money(current); const priorValue = money(prior); const amount = currentValue.minus(priorValue);
  return { amount, percentage: priorValue.isZero() ? money(0) : amount.div(priorValue.abs()).mul(100) };
}

const expenseTypes = new Set(["COGS", "OPERATING_EXPENSE", "OTHER_EXPENSE"]);

export function calculateFavorability(variance: DecimalInput, accountType: string) {
  const amount = money(variance);
  return expenseTypes.has(accountType) ? amount.negated() : amount;
}
