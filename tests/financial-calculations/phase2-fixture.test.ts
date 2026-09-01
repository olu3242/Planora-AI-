import { describe, expect, it } from "vitest";
import { calculateMetrics } from "@/domain/financial/calculation-engine";

describe("Phase 2 certified P&L", () => {
  const metrics = calculateMetrics({ REVENUE: "150000000", COGS: "40000000", OPERATING_EXPENSE: "23000000" });
  it.each([["REVENUE", "150000000"], ["COGS", "40000000"], ["GROSS_PROFIT", "110000000"], ["OPERATING_EXPENSE", "23000000"], ["EBITDA", "87000000"], ["GROSS_MARGIN_PCT", "73.33333333333333333333333333333333333333"], ["EBITDA_MARGIN_PCT", "58"]])("calculates %s exactly", (code, expected) => expect(metrics.get(code as never)?.value.toFixed()).toBe(expected));
  it("reconciles the dimension revenue split", () => expect(["70000000", "30000000", "25000000", "25000000"].reduce((sum, value) => sum.plus(value), metrics.get("REVENUE")!.value.minus("150000000")).toFixed()).toBe("150000000"));
});
