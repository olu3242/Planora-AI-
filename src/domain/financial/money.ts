import Decimal from "decimal.js";

export const FinancialDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });
export type FinancialDecimal = Decimal;
export type DecimalInput = Decimal.Value;

export function money(value: DecimalInput) {
  return new FinancialDecimal(value);
}

export function formatMoney(value: DecimalInput, currency = "USD", compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? "compact" : "standard",
  }).format(money(value).toNumber());
}

export function formatPercent(value: DecimalInput) {
  return `${money(value).toDecimalPlaces(4).toFixed()}%`;
}
