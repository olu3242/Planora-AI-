import type { CleanupTransaction } from "./profile-transactions";

export type DuplicateCandidate = {
  firstId: string;
  secondId: string;
  reason: "SAME_SOURCE_REFERENCE" | "SAME_DATE_AMOUNT_DESCRIPTION";
  decision: "REVIEW_REQUIRED";
};

/** Candidate generation only: no deduplication, deletion or posting. */
export function findDuplicateCandidates(
  transactions: readonly CleanupTransaction[],
  scope: { organizationId: string; legalEntityId: string },
): DuplicateCandidate[] {
  if (!scope.organizationId || !scope.legalEntityId) throw new Error("CLEANBOOKS_SCOPE_REQUIRED");
  const byReference = new Map<string,string>();
  const byContent = new Map<string,string>();
  const candidates: DuplicateCandidate[] = [];
  for (const t of transactions) {
    if (t.organizationId !== scope.organizationId || t.legalEntityId !== scope.legalEntityId) throw new Error("CLEANBOOKS_CROSS_SCOPE");
    if (!Number.isSafeInteger(t.amountMinor) || !/^\d{4}-\d{2}-\d{2}$/.test(t.bookedAt)) continue;
    const prefix = JSON.stringify([t.organizationId,t.legalEntityId,t.currency,t.accountId ?? "UNASSIGNED"]);
    const reference = t.sourceReference?.trim();
    const refKey = reference ? JSON.stringify([prefix,reference]) : null;
    const contentKey = JSON.stringify([prefix,t.bookedAt,t.amountMinor,t.description.trim().toLowerCase()]);
    const priorRef = refKey ? byReference.get(refKey) : undefined;
    const priorContent = byContent.get(contentKey);
    if (priorRef && priorRef !== t.id) candidates.push({firstId:priorRef,secondId:t.id,reason:"SAME_SOURCE_REFERENCE",decision:"REVIEW_REQUIRED"});
    else if (priorContent && priorContent !== t.id) candidates.push({firstId:priorContent,secondId:t.id,reason:"SAME_DATE_AMOUNT_DESCRIPTION",decision:"REVIEW_REQUIRED"});
    if (refKey && !priorRef) byReference.set(refKey,t.id);
    if (!priorContent) byContent.set(contentKey,t.id);
  }
  return candidates;
}
