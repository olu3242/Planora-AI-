/** Deterministic deduplication of trusted import events, not a bank webhook handler. */
export function cleanupImportJobKey(
  legalEntityId: string, fiscalPeriodId: string, importEventId: string,
): string {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(legalEntityId) || !uuid.test(fiscalPeriodId) || !uuid.test(importEventId)) {
    throw new Error("INVALID_CLEANUP_IMPORT_EVENT");
  }
  return `reconciliation:${legalEntityId}:${fiscalPeriodId}:import:${importEventId}`;
}
