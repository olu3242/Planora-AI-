import { assertPostingGate, validateJournalLines, type JournalLineInput, type PostingGate } from "./ai-native-controls";

/**
 * Repository-neutral posting boundary. A production adapter must implement
 * transactionality, authorization lookups, audit persistence and unique source keys.
 * This function cannot bypass the adapter's checks.
 */
export interface JournalPostingRepository {
  postAtomically(input: {
    organizationId: string;
    legalEntityId: string;
    fiscalPeriodId: string;
    sourceKey: string;
    currencyCode: string;
    lines: readonly JournalLineInput[];
    actorId: string;
  }): Promise<{ journalId: string; created: boolean }>;
}

export type AuthorizedPosting = {
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  sourceKey: string;
  currencyCode: string;
  actorId: string;
  lines: readonly JournalLineInput[];
  gate: PostingGate;
};

export async function postGovernedJournal(
  repository: JournalPostingRepository,
  input: AuthorizedPosting,
): Promise<{ journalId: string; created: boolean }> {
  if (!input.organizationId || !input.legalEntityId || !input.fiscalPeriodId || !input.actorId) {
    throw new Error("POSTING_CONTEXT_REQUIRED");
  }
  if (!input.sourceKey.trim()) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  if (!/^[A-Z]{3}$/.test(input.currencyCode)) throw new Error("CURRENCY_CODE_INVALID");
  validateJournalLines(input.lines);
  assertPostingGate(input.gate);
  return repository.postAtomically({
    organizationId: input.organizationId,
    legalEntityId: input.legalEntityId,
    fiscalPeriodId: input.fiscalPeriodId,
    sourceKey: input.sourceKey,
    currencyCode: input.currencyCode,
    actorId: input.actorId,
    lines: input.lines,
  });
}
