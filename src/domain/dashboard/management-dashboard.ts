import { calculateMetrics } from "@/domain/financial/calculation-engine";
import { money } from "@/domain/financial/money";
import { calculateMovement, calculateVariance } from "@/domain/forecast/variance";

export type DashboardLine = {
  id: string; accountCode: string; accountName: string;
  accountType: "REVENUE" | "COGS" | "OPERATING_EXPENSE" | string;
  costCenterCode: string; costCenterName: string; periodCode: string; periodName: string; periodOrdinal: number;
  actual: string; prior: string; current: string;
};

export type DashboardFilters = { period?: string; account?: string; costCenter?: string };
export type DashboardCounts = {
  workflow: Partial<Record<"DRAFT" | "SUBMITTED" | "IN_REVIEW" | "REVISION_REQUIRED" | "APPROVED" | "LOCKED", number>>;
  blockingErrors: number; warnings: number; unresolvedMappings: number; failedImports: number; failedExports: number;
  failedAgentRuns: number; failedRuntimeExecutions: number; runtimeRecoveries: number;
  recommendations: { assistant: string; version: number; status: "PENDING" | "ACCEPTED" | "EDITED" | "REJECTED" }[];
};

const metricTypes = ["REVENUE", "COGS", "OPERATING_EXPENSE"] as const;

export function buildManagementDashboard(lines: DashboardLine[], filters: DashboardFilters, counts: DashboardCounts) {
  const selected = lines.filter((line) =>
    (!filters.period || line.periodCode === filters.period) &&
    (!filters.account || line.accountCode === filters.account) &&
    (!filters.costCenter || line.costCenterCode === filters.costCenter));

  const bases = (field: "actual" | "prior" | "current") => Object.fromEntries(metricTypes.map((type) => [type,
    selected.filter((line) => line.accountType === type).reduce((total, line) => total.plus(line[field]), money(0)),
  ])) as Record<(typeof metricTypes)[number], ReturnType<typeof money>>;
  const calculated = { actual: calculateMetrics(bases("actual")), prior: calculateMetrics(bases("prior")), current: calculateMetrics(bases("current")) };
  const kpiCodes = ["REVENUE", "OPERATING_EXPENSE", "EBITDA"] as const;
  const kpis = kpiCodes.map((code) => {
    const actual = calculated.actual.get(code)!.value;
    const prior = calculated.prior.get(code)!.value;
    const current = calculated.current.get(code)!.value;
    const variance = calculateVariance(actual, current);
    const movement = calculateMovement(current, prior);
    return { code, actual: actual.toFixed(), prior: prior.toFixed(), current: current.toFixed(), variance: variance.amount.toFixed(), variancePct: variance.percentage.toFixed(), movement: movement.amount.toFixed(), movementPct: movement.percentage.toFixed() };
  });

  const detail = selected.map((line) => {
    const variance = calculateVariance(line.actual, line.current);
    const movement = calculateMovement(line.current, line.prior);
    const expense = line.accountType === "COGS" || line.accountType === "OPERATING_EXPENSE";
    const favorable = expense ? variance.amount.isNegative() : variance.amount.isPositive();
    return { ...line, variance: variance.amount.toFixed(), variancePct: variance.percentage.toFixed(), movement: movement.amount.toFixed(), movementPct: movement.percentage.toFixed(), favorable };
  });
  const magnitude = <T extends { variance?: string; movement?: string }>(field: "variance" | "movement") => (a: T, b: T) => money(b[field] ?? 0).abs().cmp(money(a[field] ?? 0).abs());
  const periods = [...new Set(selected.map((line) => line.periodCode))].map((periodCode) => {
    const periodLines = selected.filter((line) => line.periodCode === periodCode);
    const sum = (field: "actual" | "prior" | "current") => periodLines.reduce((total, line) => total.plus(line[field]), money(0)).toFixed();
    return { periodCode, periodName: periodLines[0]?.periodName ?? periodCode, ordinal: periodLines[0]?.periodOrdinal ?? 0, actual: sum("actual"), prior: sum("prior"), current: sum("current") };
  }).sort((a, b) => a.ordinal - b.ordinal);

  const generated = counts.recommendations.length;
  const statusCount = (status: string) => counts.recommendations.filter((item) => item.status === status).length;
  const accepted = statusCount("ACCEPTED"), edited = statusCount("EDITED"), rejected = statusCount("REJECTED");
  const rate = (value: number) => generated === 0 ? "0" : money(value).div(generated).mul(100).toDecimalPlaces(2).toFixed();
  return {
    kpis, recordCount: selected.length, forecastTotal: selected.reduce((total, line) => total.plus(line.current), money(0)).toFixed(),
    favorable: detail.filter((line) => line.favorable && !money(line.variance).isZero()).sort(magnitude("variance")).slice(0, 5),
    unfavorable: detail.filter((line) => !line.favorable && !money(line.variance).isZero()).sort(magnitude("variance")).slice(0, 5),
    movements: [...detail].sort(magnitude("movement")).slice(0, 5),
    material: detail.filter((line) => money(line.variance).abs().gte(100_000)).sort(magnitude("variance")),
    trend: periods,
    workflow: Object.fromEntries(["DRAFT", "SUBMITTED", "IN_REVIEW", "REVISION_REQUIRED", "APPROVED", "LOCKED"].map((status) => [status, counts.workflow[status as keyof typeof counts.workflow] ?? 0])),
    exceptions: { blockingValidationErrors: counts.blockingErrors, warnings: counts.warnings, unresolvedMappings: counts.unresolvedMappings, materialVariances: detail.filter((line) => money(line.variance).abs().gte(100_000)).length, outstandingRevisions: counts.workflow.REVISION_REQUIRED ?? 0, overdueSubmissions: 0, failedImports: counts.failedImports, failedExports: counts.failedExports, failedAgentActions: counts.failedAgentRuns, failedRuntimeActions: counts.failedRuntimeExecutions },
    agents: { generated, accepted, edited, rejected, failures: counts.failedAgentRuns + counts.failedRuntimeExecutions, recoveries: counts.runtimeRecoveries, acceptancePct: rate(accepted), editPct: rate(edited), rejectionPct: rate(rejected), assistants: [...new Map(counts.recommendations.map((item) => [`${item.assistant}:${item.version}`, { assistant: item.assistant, version: item.version }])).values()] },
  };
}
