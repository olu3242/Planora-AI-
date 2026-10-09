import { describe, expect, it } from "vitest";
import { buildManagementDashboard, type DashboardCounts, type DashboardLine } from "@/domain/dashboard/management-dashboard";

const lines: DashboardLine[] = [
  { id: "r1", accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", costCenterCode: "SALES", costCenterName: "Sales", periodCode: "P01", periodName: "January", periodOrdinal: 1, actual: "120", prior: "100", current: "110" },
  { id: "c1", accountCode: "5000", accountName: "COGS", accountType: "COGS", costCenterCode: "OPS", costCenterName: "Operations", periodCode: "P01", periodName: "January", periodOrdinal: 1, actual: "40", prior: "35", current: "38" },
  { id: "o1", accountCode: "6000", accountName: "Opex", accountType: "OPERATING_EXPENSE", costCenterCode: "OPS", costCenterName: "Operations", periodCode: "P01", periodName: "January", periodOrdinal: 1, actual: "30", prior: "28", current: "32" },
  { id: "r2", accountCode: "4000", accountName: "Revenue", accountType: "REVENUE", costCenterCode: "SALES", costCenterName: "Sales", periodCode: "P02", periodName: "February", periodOrdinal: 2, actual: "0", prior: "0", current: "-10" },
];
const counts: DashboardCounts = { workflow: { DRAFT: 2, APPROVED: 1, REVISION_REQUIRED: 1 }, blockingErrors: 2, warnings: 3, unresolvedMappings: 4, failedImports: 1, failedExports: 0, failedAgentRuns: 1, failedRuntimeExecutions: 2, runtimeRecoveries: 3, recommendations: [{ assistant: "Variance Assistant", version: 1, status: "ACCEPTED" }, { assistant: "Variance Assistant", version: 1, status: "EDITED" }, { assistant: "Review Assistant", version: 2, status: "REJECTED" }, { assistant: "Review Assistant", version: 2, status: "PENDING" }] };

describe("management dashboard aggregation", () => {
  it("uses explicit canonical values for KPIs, variance, movement, trend, workflow, exceptions, and agents", () => {
    const result = buildManagementDashboard(lines, {}, counts);
    expect(result.kpis.find((item) => item.code === "REVENUE")).toEqual({ code: "REVENUE", actual: "120", prior: "100", current: "100", variance: "20", variancePct: "20", movement: "0", movementPct: "0" });
    expect(result.kpis.find((item) => item.code === "EBITDA")?.current).toBe("30");
    expect(result.trend).toEqual([{ periodCode: "P01", periodName: "January", ordinal: 1, actual: "190", prior: "163", current: "180" }, { periodCode: "P02", periodName: "February", ordinal: 2, actual: "0", prior: "0", current: "-10" }]);
    expect(result.workflow).toMatchObject({ DRAFT: 2, SUBMITTED: 0, REVISION_REQUIRED: 1, APPROVED: 1, LOCKED: 0 });
    expect(result.exceptions).toMatchObject({ blockingValidationErrors: 2, warnings: 3, unresolvedMappings: 4, failedImports: 1, failedAgentActions: 1, failedRuntimeActions: 2 });
    expect(result.agents).toMatchObject({ generated: 4, accepted: 1, edited: 1, rejected: 1, acceptancePct: "25", editPct: "25", rejectionPct: "25", failures: 3, recoveries: 3 });
  });

  it("applies bounded filters and handles zero and negative values without division errors", () => {
    const result = buildManagementDashboard(lines, { period: "P02", account: "4000", costCenter: "SALES" }, { ...counts, recommendations: [] });
    expect(result.recordCount).toBe(1);
    expect(result.kpis.find((item) => item.code === "REVENUE")).toMatchObject({ actual: "0", prior: "0", current: "-10", variancePct: "100", movementPct: "0" });
    expect(result.agents).toMatchObject({ generated: 0, acceptancePct: "0", editPct: "0", rejectionPct: "0" });
  });
});
