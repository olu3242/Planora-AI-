import { FinancialDecimal, money, type DecimalInput } from "./money";

export type MetricCode = "REVENUE" | "COGS" | "GROSS_PROFIT" | "OPERATING_EXPENSE" | "EBITDA" | "GROSS_MARGIN_PCT" | "EBITDA_MARGIN_PCT";
export type MetricResult = { code: MetricCode; value: FinancialDecimal; inputs: MetricCode[]; formula: string };

const graph: Record<MetricCode, { inputs: MetricCode[]; formula: string; calculate?: (v: Record<string, FinancialDecimal>) => FinancialDecimal }> = {
  REVENUE: { inputs: [], formula: "SUM(REVENUE accounts)" },
  COGS: { inputs: [], formula: "SUM(COGS accounts)" },
  OPERATING_EXPENSE: { inputs: [], formula: "SUM(OPERATING_EXPENSE accounts)" },
  GROSS_PROFIT: { inputs: ["REVENUE", "COGS"], formula: "REVENUE - COGS", calculate: (v) => v.REVENUE.minus(v.COGS) },
  EBITDA: { inputs: ["GROSS_PROFIT", "OPERATING_EXPENSE"], formula: "GROSS_PROFIT - OPERATING_EXPENSE", calculate: (v) => v.GROSS_PROFIT.minus(v.OPERATING_EXPENSE) },
  GROSS_MARGIN_PCT: { inputs: ["GROSS_PROFIT", "REVENUE"], formula: "GROSS_PROFIT / REVENUE * 100", calculate: (v) => ratio(v.GROSS_PROFIT, v.REVENUE) },
  EBITDA_MARGIN_PCT: { inputs: ["EBITDA", "REVENUE"], formula: "EBITDA / REVENUE * 100", calculate: (v) => ratio(v.EBITDA, v.REVENUE) },
};

export function ratio(numerator: FinancialDecimal, denominator: FinancialDecimal) {
  return denominator.isZero() ? money(0) : numerator.div(denominator).mul(100);
}

export function dependencyOrder(definitions: Record<string, readonly string[]>) {
  const temporary = new Set<string>(); const permanent = new Set<string>(); const ordered: string[] = [];
  const visit = (code: string) => {
    if (permanent.has(code)) return;
    if (temporary.has(code)) throw new Error(`Metric dependency cycle detected at ${code}`);
    temporary.add(code);
    for (const dependency of definitions[code] ?? []) {
      if (!(dependency in definitions)) throw new Error(`Unknown metric dependency: ${dependency}`);
      visit(dependency);
    }
    temporary.delete(code); permanent.add(code); ordered.push(code);
  };
  Object.keys(definitions).forEach(visit); return ordered;
}

export function calculateMetrics(base: Record<"REVENUE" | "COGS" | "OPERATING_EXPENSE", DecimalInput>) {
  const values: Record<string, FinancialDecimal> = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, money(value)]));
  const definitions = Object.fromEntries(Object.entries(graph).map(([code, node]) => [code, node.inputs]));
  const results = new Map<MetricCode, MetricResult>();
  for (const code of dependencyOrder(definitions) as MetricCode[]) {
    const node = graph[code];
    if (node.calculate) values[code] = node.calculate(values);
    results.set(code, { code, value: values[code], inputs: node.inputs, formula: node.formula });
  }
  return results;
}

export const metricGraph = graph;
