import 'server-only';
import { prisma } from '@/lib/prisma';
import { isApprovedBankMapping } from '@/domain/accounting/bank-mapping-policy';

/**
 * Read-only mapping resolver. Must be called in an authenticated tenant context.
 * Never grants approval or updates bank transaction state.
 */
export async function resolveApprovedCashMapping(
  organizationId: string,
  bankAccountId: string,
  postedDate: Date,
): Promise<{ cashAccountId: string } | null> {
  if (!organizationId || !bankAccountId || !Number.isFinite(postedDate.getTime())) {
    throw new Error('BANK_MAPPING_CONTEXT_REQUIRED');
  }
  const bank = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, organizationId, active: true },
    select: { organizationId: true, legalEntityId: true, currencyCode: true },
  });
  if (!bank) throw new Error('BANK_ACCOUNT_NOT_FOUND');
  const mappings = await prisma.bankCashMapping.findMany({
    where: {
      organizationId, bankAccountId,
      approvedById: { not: null },
      approvedAt: { not: null },
      revokedAt: null,
      effectiveFrom: { lte: postedDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: postedDate } }],
    },
    select: {
      cashAccountId: true, approvedById: true, preparedById: true,
      cashAccount: {
        select: {
          organizationId: true, active: true, systemPurpose: true,
        },
      },
    },
  });
  const eligible = mappings.filter(mapping =>
    mapping.approvedById !== mapping.preparedById &&
    mapping.cashAccount.systemPurpose === 'CASH' &&
    mapping.cashAccount.active &&
    isApprovedBankMapping({
      organizationId,
      bankOrganizationId: bank.organizationId,
      cashOrganizationId: mapping.cashAccount.organizationId,
      approved: true, revoked: false,
      currency: bank.currencyCode, cashCurrency: bank.currencyCode,
    }),
  );
  // Never silently select between overlapping approved mappings.
  if (eligible.length > 1) throw new Error('BANK_LEDGER_MAPPING_AMBIGUOUS');
  return eligible.length === 1 ? { cashAccountId: eligible[0].cashAccountId } : null;
}
