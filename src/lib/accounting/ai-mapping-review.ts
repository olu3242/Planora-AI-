import type { MappingDecision } from "./ai-mapping-engine";

export type ReviewAction = "APPROVE" | "REJECT" | "OVERRIDE";
export type MappingReview = Readonly<{
  tenantId: string;
  transactionId: string;
  reviewerId: string;
  action: ReviewAction;
  selectedAccountId: string | null;
  reason: string;
  proposalKey: string;
}>;
export type MappingReviewContext = Readonly<{
  authenticatedTenantId: string;
  reviewerId: string;
  reviewerCanReview: boolean;
  allowedAccountIds: readonly string[];
  previouslyReviewed: boolean;
}>;

/** A review decision is evidence only. It cannot post or authorize a journal. */
export function reviewMapping(
  proposal: MappingDecision,
  action: ReviewAction,
  selectedAccountId: string | null,
  reason: string,
  ctx: MappingReviewContext,
): MappingReview {
  if (proposal.tenantId !== ctx.authenticatedTenantId) throw new Error("TENANT_MISMATCH");
  if (!ctx.reviewerId.trim() || !ctx.reviewerCanReview) throw new Error("FORBIDDEN_MAPPING_REVIEW");
  if (ctx.previouslyReviewed) throw new Error("MAPPING_ALREADY_REVIEWED");
  if (!reason.trim()) throw new Error("MAPPING_REVIEW_REASON_REQUIRED");
  if (action === "APPROVE" && (proposal.route === "EXCEPTION" || !proposal.accountId)) {
    throw new Error("MAPPING_EXCEPTION_REQUIRES_OVERRIDE");
  }
  const accountId = action === "REJECT" ? null : action === "APPROVE" ? proposal.accountId : selectedAccountId;
  if (action !== "REJECT" && (!accountId || !ctx.allowedAccountIds.includes(accountId))) {
    throw new Error("MAPPING_ACCOUNT_NOT_ELIGIBLE");
  }
  return {
    tenantId: proposal.tenantId, transactionId: proposal.transactionId,
    reviewerId: ctx.reviewerId, action, selectedAccountId: accountId,
    reason: reason.trim(), proposalKey: proposal.idempotencyKey,
  };
}
