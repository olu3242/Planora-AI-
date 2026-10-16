/** A correcting reversal must refer to a source journal explicitly listed on the cleanup case. */
export function assertCleanupJournalLink(
  issue: { kind: string; recordIds: readonly string[] },
  reversalOfId: string | null,
): void {
  if (issue.kind !== "UNBALANCED_JOURNAL" && issue.kind !== "DUPLICATE_SOURCE") {
    throw new Error("CLEANUP_CORRECTION_TYPE_UNSUPPORTED");
  }
  if (!reversalOfId || !issue.recordIds.includes(reversalOfId)) {
    throw new Error("CLEANUP_CORRECTION_LINK_UNVERIFIED");
  }
}
