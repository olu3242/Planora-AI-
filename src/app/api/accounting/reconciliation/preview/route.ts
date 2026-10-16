import { withTenantApi } from '@/lib/tenant-request';
import { requireApiSession } from '@/auth/session';
import { AppError, errorResponse } from '@/lib/errors';
import { correlationId } from '@/lib/request';
import { previewReconciliationForTrustedActor } from '@/application/accounting/trusted-reconciliation-preview';
import { z } from 'zod';

const schema = z.object({ bankAccountId: z.string().uuid() });

async function handleGET(request: Request) {
  const cid = correlationId(request);
  try {
    const session = await requireApiSession('financial.read');
    const parsed = schema.safeParse({
      bankAccountId: new URL(request.url).searchParams.get('bankAccountId'),
    });
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Valid bank account is required.', 400);
    const result = await previewReconciliationForTrustedActor({
      organizationId: session.organization.id,
      actorId: session.user.id,
    }, parsed.data.bankAccountId);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error, cid);
  }
}
export const GET = withTenantApi(handleGET);
