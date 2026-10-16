import 'server-only';
import { authenticationPrisma } from '@/lib/prisma';
import { withBankMappingTenant } from '@/lib/accounting/bank-mapping-tenant-context';
import { canPreviewBankReconciliation } from '@/domain/accounting/reconciliation-preview-access';
import { previewReconciliation } from './reconciliation-service';

export async function previewReconciliationForTrustedActor(
  trusted: { organizationId: string; actorId: string },
  bankAccountId: string,
) {
  return withBankMappingTenant(authenticationPrisma, trusted, async tx => {
    const member = await tx.organizationMembership.findFirst({
      where: { organizationId: trusted.organizationId, userId: trusted.actorId, active: true },
      select: { role: true, active: true },
    });
    if (!member || !canPreviewBankReconciliation(member.role, member.active)) {
      throw new Error('RECONCILIATION_PREVIEW_DENIED');
    }
    return previewReconciliation(trusted.organizationId, bankAccountId);
  });
}
