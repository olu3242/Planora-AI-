import type { CleanupFinding } from "./bookkeeping-cleanup";
export type CleanupReviewDecision = "ACCEPT_FINDING" | "REJECT_FINDING";
export type CleanupReviewInput = { transactionId: string; kind: CleanupFinding["kind"]; decision: CleanupReviewDecision; reason: string };
export function validateCleanupReviewInput(input: CleanupReviewInput, findings: readonly CleanupFinding[]) {
  if (!input.transactionId || !["DUPLICATE_CANDIDATE", "INVALID_INPUT"].includes(input.kind)) throw new Error("Invalid finding identity.");
  if (!["ACCEPT_FINDING", "REJECT_FINDING"].includes(input.decision)) throw new Error("Invalid review decision.");
  if (!input.reason.trim() || input.reason.length > 2000) throw new Error("Review reason is required and must be at most 2000 characters.");
  const matches = findings.filter(f => f.transactionId === input.transactionId && f.kind === input.kind);
  if (matches.length !== 1) throw new Error("Finding must exist exactly once.");
  return { ...input, reason: input.reason.trim() };
}
