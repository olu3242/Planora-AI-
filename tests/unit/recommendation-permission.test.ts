import { describe, expect, it } from "vitest";
import { recommendationReviewPermission } from "../../src/application/agents/recommendation-permission";

describe("agent recommendation review authority",()=>{
 it.each([
  ["COA_MAPPING_REVIEW","accounting.recommendation.review"],
  ["FINANCIAL_STATEMENT_REVIEW","accounting.recommendation.review"],
  ["ACCOUNTING_CLOSE_READINESS","accounting.recommendation.review"],
  ["FORECAST_REFRESH_REVIEW","fpanda.recommendation.review"],
  ["MANAGEMENT_INSIGHT_REVIEW","management.insight.review"],
 ])("maps %s to %s",(type,permission)=>expect(recommendationReviewPermission(type)).toBe(permission));
 it("fails closed for an unknown recommendation type",()=>expect(()=>recommendationReviewPermission("UNKNOWN")).toThrow("UNSUPPORTED_RECOMMENDATION_TYPE"));
});
