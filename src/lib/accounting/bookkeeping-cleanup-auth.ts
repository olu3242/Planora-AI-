import type { RoleCode } from "@prisma/client";
import type { CleanupAction } from "./bookkeeping-cleanup-workflow";

/** Server-derived role mapping; never accept the actor or role from request JSON. */
export function cleanupRoleForSession(role: RoleCode): CleanupAction["actorRole"] {
  switch (role) {
    case "CFO": return "CONTROLLER";
    case "FPA_DIRECTOR": return "ACCOUNTANT";
    case "ANALYST": return "BOOKKEEPER";
    default: throw new Error("FORBIDDEN_CLEANUP");
  }
}
export const userCleanupActions = ["INVESTIGATE", "PROPOSE", "APPROVE", "REJECT", "REOPEN"] as const;
export type UserCleanupAction = (typeof userCleanupActions)[number];
export function parseUserCleanupAction(raw: unknown): {
  kind: UserCleanupAction; expectedRevision: number; evidenceId: string; proposal?: string;
} {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_CLEANUP_ACTION");
  const value = raw as Record<string, unknown>;
  if (!userCleanupActions.some(kind => kind === value.kind)) throw new Error("INVALID_CLEANUP_ACTION");
  if (!Number.isSafeInteger(value.expectedRevision) || (value.expectedRevision as number) < 0) throw new Error("INVALID_CLEANUP_ACTION");
  if (typeof value.evidenceId !== "string" || !value.evidenceId.trim() || value.evidenceId.length > 256) throw new Error("INVALID_CLEANUP_ACTION");
  if (value.proposal !== undefined && (typeof value.proposal !== "string" || value.proposal.length > 4000)) throw new Error("INVALID_CLEANUP_ACTION");
  return {
    kind: value.kind as UserCleanupAction,
    expectedRevision: value.expectedRevision as number,
    evidenceId: value.evidenceId.trim(),
    proposal: typeof value.proposal === "string" ? value.proposal : undefined,
  };
}
