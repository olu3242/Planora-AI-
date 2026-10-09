import type { Permission } from "@/permissions/permissions";

export function recommendationReviewPermission(type:string):Permission{
 if(["COA_MAPPING_REVIEW","FINANCIAL_STATEMENT_REVIEW","ACCOUNTING_CLOSE_READINESS"].includes(type)) return "accounting.recommendation.review";
 if(type==="FORECAST_REFRESH_REVIEW") return "fpanda.recommendation.review";
 if(type==="MANAGEMENT_INSIGHT_REVIEW") return "management.insight.review";
 throw new Error("UNSUPPORTED_RECOMMENDATION_TYPE");
}
