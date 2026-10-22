import type { CleanupFinding } from "./bookkeeping-cleanup";
export type FindingReview = { finding: CleanupFinding; status: "PENDING" | "ACCEPT_FINDING" | "REJECT_FINDING" };
export function cleanupReviewMetrics(items: readonly FindingReview[]) {
  const pending = items.filter(x => x.status === "PENDING").length;
  const accepted = items.filter(x => x.status === "ACCEPT_FINDING").length;
  const rejected = items.filter(x => x.status === "REJECT_FINDING").length;
  return { total: items.length, pending, accepted, rejected, complete: pending === 0 };
}
