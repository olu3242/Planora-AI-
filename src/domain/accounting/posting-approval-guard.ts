/**
 * Pure precondition guard for proposed journal approval consumption.
 * A passing result is NOT posting authorization; the canonical posting command
 * must re-check all values under a single database transaction and enforce RLS.
 */
export type PostingApprovalSnapshot = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  sourceKey: string;
  preparedById: string;
  decidedById: string | null;
  decision: string;
  expiresAt: Date | null;
  consumedAt: Date | null;
}>;
export type PostingApprovalRequest = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  sourceKey: string;
  actorId: string;
  now: Date;
  periodState: 'OPEN' | 'SOFT_CLOSED' | 'HARD_CLOSED';
}>;
export type PostingApprovalResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; code: 'INVALID_SCOPE' | 'PERIOD_CLOSED' | 'APPROVAL_NOT_APPROVED' | 'SELF_APPROVAL' | 'APPROVAL_CONSUMED' | 'APPROVAL_EXPIRED' | 'INVALID_TIMESTAMP' }>;

export function checkPostingApproval(
  approval: PostingApprovalSnapshot,
  request: PostingApprovalRequest,
): PostingApprovalResult {
  if (![request.organizationId, request.legalEntityId, request.fiscalPeriodId, request.sourceKey, request.actorId].every(x => typeof x === 'string' && x.trim())
    || approval.organizationId !== request.organizationId
    || approval.legalEntityId !== request.legalEntityId
    || approval.fiscalPeriodId !== request.fiscalPeriodId
    || approval.sourceKey !== request.sourceKey)
    return { ok: false, code: 'INVALID_SCOPE' };
  if (request.periodState !== 'OPEN') return { ok: false, code: 'PERIOD_CLOSED' };
  if (approval.decision !== 'APPROVED' || !approval.decidedById)
    return { ok: false, code: 'APPROVAL_NOT_APPROVED' };
  if (approval.preparedById === approval.decidedById)
    return { ok: false, code: 'SELF_APPROVAL' };
  if (approval.consumedAt) return { ok: false, code: 'APPROVAL_CONSUMED' };
  if (!Number.isFinite(request.now.getTime()) || (approval.expiresAt && !Number.isFinite(approval.expiresAt.getTime())))
    return { ok: false, code: 'INVALID_TIMESTAMP' };
  if (approval.expiresAt && approval.expiresAt.getTime() <= request.now.getTime())
    return { ok: false, code: 'APPROVAL_EXPIRED' };
  return { ok: true };
}
