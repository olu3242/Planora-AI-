/** Only a trusted, committed bank-import result can produce cleanup work. */
export type VerifiedBankImportCompletion = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  importEventId: string;
  committed: true;
  importedCount: number;
}>;
export function assertVerifiedBankImportCompletion(value: VerifiedBankImportCompletion): void {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (value.committed !== true ||
      ![value.organizationId, value.legalEntityId, value.fiscalPeriodId, value.importEventId].every(x => uuid.test(x)) ||
      !Number.isSafeInteger(value.importedCount) || value.importedCount < 0) {
    throw new Error("INVALID_VERIFIED_BANK_IMPORT");
  }
}
