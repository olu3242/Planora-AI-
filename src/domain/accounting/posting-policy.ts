import { validateJournal, type JournalLineInput } from "./journal-validation";

export type PostingPeriodState = "OPEN" | "SOFT_CLOSED" | "HARD_CLOSED";
export type PostingIntent = Readonly<{
  organizationId: string;
  legalEntityId: string;
  periodId: string;
  currency: string;
  sourceKey: string;
  lines: readonly JournalLineInput[];
}>;

export function validatePostingIntent(
  intent: PostingIntent,
  context: Readonly<{
    organizationId: string;
    legalEntityId: string;
    periodId: string;
    periodState: PostingPeriodState;
    allowedCurrency: string;
    existingSourceKey?: string;
  }>,
): void {
  if (!intent.organizationId || intent.organizationId !== context.organizationId) throw new Error("TENANT_MISMATCH");
  if (!intent.legalEntityId || intent.legalEntityId !== context.legalEntityId) throw new Error("ENTITY_MISMATCH");
  if (!intent.periodId || intent.periodId !== context.periodId) throw new Error("PERIOD_MISMATCH");
  if (context.periodState !== "OPEN") throw new Error("PERIOD_NOT_OPEN");
  if (!/^[A-Z]{3}$/.test(intent.currency) || intent.currency !== context.allowedCurrency) throw new Error("CURRENCY_MISMATCH");
  if (!intent.sourceKey.trim()) throw new Error("SOURCE_KEY_REQUIRED");
  if (context.existingSourceKey === intent.sourceKey) throw new Error("DUPLICATE_SOURCE_KEY");
  validateJournal(intent.lines);
}
