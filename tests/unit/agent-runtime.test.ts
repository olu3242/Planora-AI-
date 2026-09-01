import { describe, expect, it } from "vitest";
import { nextBestActions } from "@/agents/next-best-action";
import { classifyFailure, mayRetry } from "@/runtime/failure-classification";
import { AppError } from "@/lib/errors";
import { agentDefinitions, sharedAgentPolicy } from "@/agents/definitions";

describe("deterministic next-best action", () => {
  it("prioritizes blocking validation and never recommends submission", () => {
    const actions = nextBestActions({ role: "ANALYST", status: "DRAFT", blockingErrors: 3, warningCount: 1, lineCount: 12, commentaryCount: 1 });
    expect(actions).toEqual([{ code: "RESOLVE_VALIDATION", label: "Resolve blocking validation errors", reason: "3 blocking validation issues prevent submission.", requiresHumanAction: true }]);
    expect(actions.some((action) => action.code === "SUBMIT_FORECAST")).toBe(false);
  });

  it("keeps approval and locking as explicit human review actions", () => {
    expect(nextBestActions({ role: "FPA_DIRECTOR", status: "IN_REVIEW", blockingErrors: 0, warningCount: 0, lineCount: 2, commentaryCount: 1 })[0].code).toBe("REVIEW_EXCEPTION");
    expect(nextBestActions({ role: "CFO", status: "APPROVED", blockingErrors: 0, warningCount: 0, lineCount: 2, commentaryCount: 1 })[0]).toMatchObject({ code: "FINAL_REVIEW", requiresHumanAction: true });
  });

  it("moves completed Analyst work to submission eligibility and submitted work to Director review", () => {
    expect(nextBestActions({ role: "ANALYST", status: "DRAFT", blockingErrors: 0, warningCount: 0, lineCount: 2, commentaryCount: 1 })[0].code).toBe("SUBMIT_FORECAST");
    expect(nextBestActions({ role: "FPA_DIRECTOR", status: "SUBMITTED", blockingErrors: 0, warningCount: 0, lineCount: 2, commentaryCount: 1 })[0].code).toBe("START_REVIEW");
  });
});

describe("agent authority contract", () => {
  it("defines only observe/recommend/assist agents with authenticated tenant scope and no financial write authority", () => {
    expect(agentDefinitions.every((definition) => definition.agentId.match(/^PLANORA\.[A-Z]+\.[A-Z]+\.[A-Z_]+\.v\d+$/))).toBe(true);
    expect(agentDefinitions.every((definition) => ["A0_OBSERVE", "A1_RECOMMEND", "A2_ASSIST"].includes(definition.authorityClass))).toBe(true);
    expect(agentDefinitions.every((definition) => definition.tenantScope === "AUTHENTICATED_ORGANIZATION")).toBe(true);
    expect(sharedAgentPolicy.financialWritePermission).toBe(false);
    expect(sharedAgentPolicy.forbiddenActions).toEqual(expect.arrayContaining(["approveForecast", "lockForecast", "writeFinancialData", "readOtherTenant"]));
    expect(agentDefinitions.flatMap((definition) => definition.allowedTools)).not.toEqual(expect.arrayContaining(["approveForecast", "lockForecast", "updateForecastValue"]));
  });
});

describe("runtime failure policy", () => {
  it("classifies authorization and validation failures as non-retryable", () => {
    expect(classifyFailure(new AppError("FORBIDDEN", "Denied", 403))).toBe("AUTHORIZATION");
    expect(classifyFailure(new AppError("VALIDATION_ERROR", "Invalid", 400))).toBe("VALIDATION");
    expect(mayRetry("AUTHORIZATION", true, 1, 3)).toBe(false);
    expect(mayRetry("VALIDATION", true, 1, 3)).toBe(false);
  });

  it("allows bounded retry only for safe transient or dependency failures", () => {
    expect(classifyFailure(Object.assign(new Error("reset"), { code: "ECONNRESET" }))).toBe("TRANSIENT");
    expect(mayRetry("TRANSIENT", true, 1, 3)).toBe(true);
    expect(mayRetry("TRANSIENT", false, 1, 3)).toBe(false);
    expect(mayRetry("TRANSIENT", true, 3, 3)).toBe(false);
  });

  it("covers every failure category and fails closed for unsafe categories", () => {
    expect(classifyFailure(Object.assign(new Error("unique"), { code: "P2002" }))).toBe("DATA_INTEGRITY");
    expect(classifyFailure(Object.assign(new Error("down"), { code: "ECONNREFUSED" }))).toBe("DEPENDENCY");
    expect(classifyFailure(new TypeError("defect"))).toBe("LOGIC");
    expect(classifyFailure(new Error("unclassified"))).toBe("UNKNOWN");
    for (const category of ["VALIDATION", "AUTHORIZATION", "DATA_INTEGRITY", "LOGIC", "UNKNOWN"] as const) expect(mayRetry(category, true, 1, 3)).toBe(false);
  });
});
