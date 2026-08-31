import { describe, expect, it } from "vitest";
import { dependencyOrder, ratio } from "@/domain/financial/calculation-engine";
import { assertValidFiscalPeriods } from "@/domain/financial/fiscal-calendar";
import { assertValidHierarchy } from "@/domain/financial/hierarchy";
import { financialFactGrain } from "@/domain/financial/lineage";
import { money } from "@/domain/financial/money";
import { assertVersionMutable, correctionDraft } from "@/domain/financial/versions";

describe("canonical financial rules", () => {
  it("orders dependencies and rejects cycles", () => {
    expect(dependencyOrder({ revenue: [], gross: ["revenue"], ebitda: ["gross"] })).toEqual(["revenue", "gross", "ebitda"]);
    expect(() => dependencyOrder({ a: ["b"], b: ["a"] })).toThrow(/cycle/i);
  });
  it("defines zero denominator as zero rather than NaN", () => expect(ratio(money(1), money(0)).toFixed()).toBe("0"));
  it("rejects invalid hierarchies and fiscal overlaps", () => {
    expect(() => assertValidHierarchy([{ id: "a", parentId: "b" }, { id: "b", parentId: "a" }])).toThrow(/cycle/i);
    const year = { code: "FY26", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") };
    expect(() => assertValidFiscalPeriods(year, [{ code: "P1", startDate: new Date("2026-01-01"), endDate: new Date("2026-01-31") }, { code: "P2", startDate: new Date("2026-01-31"), endDate: new Date("2026-02-28") }])).toThrow(/overlap/i);
  });
  it("protects approved/published versions and creates attributed corrections", () => {
    expect(() => assertVersionMutable("plan", "APPROVED")).toThrow(/immutable/i);
    expect(() => assertVersionMutable("forecast", "PUBLISHED")).toThrow(/immutable/i);
    expect(correctionDraft(2, "protected-id", "Correct classification")).toEqual({ version: 3, status: "DRAFT", correctionOfId: "protected-id", reason: "Correct classification" });
  });
  it("produces a stable grain across object key order", () => {
    const common = { accountId: "a", fiscalPeriodId: "p", scenario: "ACTUAL", currencyCode: "USD", sourceIdentifier: "s", versionContext: "v" };
    expect(financialFactGrain({ ...common, geographyId: "g", productId: "x" })).toBe(financialFactGrain({ productId: "x", geographyId: "g", ...common }));
  });
});
