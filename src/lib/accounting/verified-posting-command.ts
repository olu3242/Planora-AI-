import type { PrismaClient } from "@prisma/client";
import { resolveAccountingPrincipal } from "./verified-session";
import { createPrismaJournalPostingRepository } from "./prisma-posting-adapter";
import { postGovernedJournal, type AuthorizedPosting } from "./governed-posting";

/**
 * Fail-closed command boundary. The caller supplies a server-received session token;
 * the principal is always resolved from persisted session state.
 * Not a public API route: approval evidence must be verified before activation.
 */
export async function postAccountingFromSession(
  db: PrismaClient,
  sessionToken: string,
  command: Omit<AuthorizedPosting, "actorId" | "organizationId" | "gate">,
): Promise<{ journalId: string; created: boolean }> {
  const principal = await resolveAccountingPrincipal(db, sessionToken);
  if (!["CFO", "FPA_DIRECTOR"].includes(principal.role)) {
    throw new Error("POSTING_ROLE_DENIED");
  }
  // No persisted approval decision is currently bound to accounting journals.
  // Deny rather than fabricate a humanApproved=true gate.
  void command;
  void createPrismaJournalPostingRepository;
  void postGovernedJournal;
  throw new Error("PERSISTED_ACCOUNTING_APPROVAL_NOT_IMPLEMENTED");
}
