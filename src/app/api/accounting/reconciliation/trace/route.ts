import { withTenantApi } from '@/lib/tenant-request';
import { requireApiSession } from '@/auth/session';
import { errorResponse, AppError } from '@/lib/errors';
import { correlationId } from '@/lib/request';
import { canPreviewBankReconciliation } from '@/domain/accounting/reconciliation-preview-access';
import { getReconciliationJournalTrace } from '@/application/accounting/reconciliation-journal-trace';
import { z } from 'zod';

const query = z.object({ bankTransactionId: z.string().uuid() });
async function handleGET(request: Request) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession('financial.read');
    if (!canPreviewBankReconciliation(session.membership.role, session.membership.active)) {
      throw new AppError('FORBIDDEN', 'Reconciliation evidence access denied.', 403);
    }
    const parsed = query.safeParse({
      bankTransactionId: new URL(request.url).searchParams.get('bankTransactionId'),
    });
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Valid transaction id required.', 400);
    const trace = await getReconciliationJournalTrace(session.organization.id, parsed.data.bankTransactionId);
    if (!trace) throw new AppError('NOT_FOUND', 'Reconciliation evidence unavailable.', 404);
    return Response.json(trace);
  } catch (error) {
    return errorResponse(error, cid);
  }
}
export const GET = withTenantApi(handleGET);
