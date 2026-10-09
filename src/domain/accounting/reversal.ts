import { validateJournal, type JournalLineInput } from "./journal-validation";
export function createReversalLines(original: readonly JournalLineInput[]): JournalLineInput[] {
  validateJournal(original);
  return original.map(({ accountId, debitMinor, creditMinor }) => ({
    accountId, debitMinor: creditMinor, creditMinor: debitMinor,
  }));
}
