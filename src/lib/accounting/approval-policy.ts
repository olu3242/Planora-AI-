/** Deterministic approval validation. The approval record must originate from trusted persistence. */
export type AccountingApprovalEvidence = Readonly<{
  id: string;
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  sourceKey: string;
  preparedById: string;
  approvedById: string;
  decision: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  expiresAt: Date;
  consumedAt: Date | null;
}>;

export function assertAccountingApproval(
  approval: AccountingApprovalEvidence | null,
  context: {
    organizationId: string;
    legalEntityId: string;
    fiscalPeriodId: string;
    sourceKey: string;
    actorId: string;
  },
  now: Date = new Date(),
): asserts approval is AccountingApprovalEvidence {
  if (!approval || approval.decision !== "APPROVED") throw new Error("APPROVAL_REQUIRED");
  if (!approval.id || !approval.approvedById || !approval.preparedById ||
      approval.organizationId !== context.organizationId ||
      approval.legalEntityId !== context.legalEntityId ||
      approval.fiscalPeriodId !== context.fiscalPeriodId ||
      approval.sourceKey !== context.sourceKey ||
      approval.preparedById !== context.actorId) throw new Error("APPROVAL_SCOPE_MISMATCH");
  if (approval.approvedById === approval.preparedById) throw new Error("SELF_APPROVAL_DENIED");
  if (!(approval.expiresAt instanceof Date) || !Number.isFinite(approval.expiresAt.getTime()) ||
      approval.expiresAt <= now) throw new Error("APPROVAL_EXPIRED");
  if (approval.consumedAt !== null) throw new Error("APPROVAL_ALREADY_CONSUMED");
}
