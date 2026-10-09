import type { Prisma } from "@prisma/client";
import { assertAccountingApproval } from "./approval-policy";

export type ApprovalScope = {
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  sourceKey: string;
  actorId: string;
};

/** Call inside the SAME serializable transaction that creates the journal. */
export async function verifyPersistedAccountingApproval(
  tx: Prisma.TransactionClient,
  scope: ApprovalScope,
) {
  const record = await tx.accountingPostingApproval.findUnique({
    where: { organizationId_sourceKey: {
      organizationId: scope.organizationId, sourceKey: scope.sourceKey,
    } },
  });
  assertAccountingApproval(record && record.decidedById && record.expiresAt ? {
    id: record.id,
    organizationId: record.organizationId,
    legalEntityId: record.legalEntityId,
    fiscalPeriodId: record.fiscalPeriodId,
    sourceKey: record.sourceKey,
    preparedById: record.preparedById,
    approvedById: record.decidedById,
    decision: record.decision === "PENDING" ? "REJECTED" : record.decision,
    expiresAt: record.expiresAt,
    consumedAt: record.consumedAt,
  } : null, scope);
  const reviewer = await tx.organizationMembership.findFirst({
    where: { organizationId: scope.organizationId, userId: record!.decidedById!, active: true },
  });
  if (!reviewer || !["CFO", "FPA_DIRECTOR"].includes(reviewer.role)) {
    throw new Error("APPROVER_ROLE_DENIED");
  }
  return record!;
}
