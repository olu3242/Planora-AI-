import type { CleanupIssue } from "./bookkeeping-cleanup";

/** Immutable, human-governed cleanup case. This state machine never posts journals. */
export type CleanupCaseState = "DETECTED" | "INVESTIGATING" | "PROPOSED" | "APPROVED" | "REJECTED" | "EXECUTION_PENDING" | "VERIFIED" | "REOPENED";
export type CleanupCase = Readonly<{
  id: string;
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  issue: CleanupIssue;
  state: CleanupCaseState;
  revision: number;
  assignedRole: "BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER";
  proposal: string | null;
  proposedBy: string | null;
  approvedBy: string | null;
  evidenceIds: readonly string[];
  history: readonly { state: CleanupCaseState; actorId: string; evidenceId: string }[];
}>;
export type CleanupAction = Readonly<{
  kind: "INVESTIGATE" | "PROPOSE" | "APPROVE" | "REJECT" | "QUEUE_EXECUTION" | "VERIFY" | "REOPEN";
  actorId: string;
  actorRole: "BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER";
  evidenceId: string;
  proposal?: string;
  expectedRevision: number;
}>;
const next: Record<CleanupAction["kind"], readonly CleanupCaseState[]> = {
  INVESTIGATE: ["DETECTED", "REOPENED"],
  PROPOSE: ["INVESTIGATING"],
  APPROVE: ["PROPOSED"],
  REJECT: ["PROPOSED"],
  QUEUE_EXECUTION: ["APPROVED"],
  VERIFY: ["EXECUTION_PENDING"],
  REOPEN: ["VERIFIED", "REJECTED"],
};
const destination: Record<CleanupAction["kind"], CleanupCaseState> = {
  INVESTIGATE: "INVESTIGATING", PROPOSE: "PROPOSED", APPROVE: "APPROVED",
  REJECT: "REJECTED", QUEUE_EXECUTION: "EXECUTION_PENDING",
  VERIFY: "VERIFIED", REOPEN: "REOPENED",
};
export function createCleanupCase(scope: {
  organizationId: string; legalEntityId: string; fiscalPeriodId: string;
}, issue: CleanupIssue): CleanupCase {
  if (![scope.organizationId, scope.legalEntityId, scope.fiscalPeriodId, issue.key].every(Boolean)) throw new Error("INVALID_CLEANUP_SCOPE");
  return {
    ...scope, id: `cleanup:${scope.organizationId}:${scope.legalEntityId}:${scope.fiscalPeriodId}:${issue.key}`,
    issue, state: "DETECTED", revision: 0,
    assignedRole: issue.severity === "HIGH" ? "CONTROLLER" : "BOOKKEEPER",
    proposal: null, proposedBy: null, approvedBy: null, evidenceIds: [], history: [],
  };
}
export function transitionCleanupCase(current: CleanupCase, action: CleanupAction): CleanupCase {
  if (current.revision !== action.expectedRevision) throw new Error("STALE_CLEANUP_REVISION");
  if (!action.actorId.trim() || !action.evidenceId.trim()) throw new Error("CLEANUP_EVIDENCE_REQUIRED");
  if (!next[action.kind].includes(current.state)) throw new Error("INVALID_CLEANUP_TRANSITION");
  if (action.kind === "PROPOSE" && !action.proposal?.trim()) throw new Error("CLEANUP_PROPOSAL_REQUIRED");
  if (action.kind === "APPROVE" && (action.actorRole !== "CONTROLLER" || current.proposedBy === action.actorId)) throw new Error("CLEANUP_APPROVAL_DENIED");
  if (action.kind === "QUEUE_EXECUTION" && (action.actorRole !== "CONTROLLER" || !current.approvedBy)) throw new Error("CLEANUP_EXECUTION_DENIED");
  if (action.kind === "VERIFY" && (action.actorRole === "BOOKKEEPER" || action.actorId === current.proposedBy)) throw new Error("CLEANUP_VERIFICATION_DENIED");
  const state = destination[action.kind];
  return {
    ...current, state, revision: current.revision + 1,
    proposal: action.kind === "PROPOSE" ? action.proposal!.trim() : current.proposal,
    proposedBy: action.kind === "PROPOSE" ? action.actorId : current.proposedBy,
    approvedBy: action.kind === "APPROVE" ? action.actorId : action.kind === "REOPEN" ? null : current.approvedBy,
    evidenceIds: [...current.evidenceIds, action.evidenceId],
    history: [...current.history, { state, actorId: action.actorId, evidenceId: action.evidenceId }],
  };
}
