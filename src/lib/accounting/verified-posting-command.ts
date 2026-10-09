import type { PrismaClient } from "@prisma/client";
import { resolveAccountingPrincipal } from "./verified-session";
import { createPrismaJournalPostingRepository } from "./prisma-posting-adapter";
import type { AuthorizedPosting } from "./governed-posting";

/**
 * Trusted server-only posting boundary. The session establishes actor and tenant.
 * The Prisma adapter independently verifies and consumes a persisted, independent
 * approval in the same serializable transaction as journal creation and audit.
 * No caller-supplied humanApproved flag is accepted.
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
  const repository = createPrismaJournalPostingRepository(
    db, principal.userId, principal.organizationId,
  );
  return repository.postAtomically({
    ...command,
    organizationId: principal.organizationId,
    actorId: principal.userId,
  });
}
