-- A posted journal may be reconciled against at most one bank movement.
-- Deployment must first inspect and resolve existing duplicates.
CREATE UNIQUE INDEX "BankTransaction_matchedJournalId_key" ON "BankTransaction"("matchedJournalId");
