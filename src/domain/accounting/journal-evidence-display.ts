export type JournalEvidenceDisplay = Readonly<{
  lineId: string;
  journalId: string;
  totalCount: number;
  visibleIds: readonly string[];
  moreAvailable: boolean;
}>;

export function journalEvidenceDisplay(
  lineId: string, journalId: string, totalCount: number, visibleIds: readonly string[],
): JournalEvidenceDisplay {
  if (!lineId.trim() || !journalId.trim() ||
      !Number.isSafeInteger(totalCount) || totalCount < 0 ||
      visibleIds.length > totalCount) throw new Error('JOURNAL_EVIDENCE_DISPLAY_INVALID');
  return {
    lineId, journalId, totalCount,
    visibleIds: [...visibleIds],
    moreAvailable: totalCount > visibleIds.length,
  };
}
