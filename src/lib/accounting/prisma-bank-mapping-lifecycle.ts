import { Prisma, type PrismaClient } from '@prisma/client';

export type BankMappingActor = Readonly<{ organizationId: string; actorId: string }>;

function requireContext(actor: BankMappingActor) {
  if (!actor.organizationId?.trim() || !actor.actorId?.trim()) throw new Error('BANK_MAPPING_CONTEXT_REQUIRED');
}

async function requireFinanceRole(tx: Prisma.TransactionClient, actor: BankMappingActor) {
  const member = await tx.organizationMembership.findFirst({
    where: { organizationId: actor.organizationId, userId: actor.actorId, active: true },
    select: { role: true },
  });
  if (!member || !['CFO', 'FPA_DIRECTOR'].includes(member.role)) throw new Error('BANK_MAPPING_ROLE_DENIED');
}

export async function proposeBankCashMapping(
  db: PrismaClient,
  actor: BankMappingActor,
  input: { bankAccountId: string; cashAccountId: string; effectiveFrom: Date; effectiveTo?: Date | null },
) {
  requireContext(actor);
  if (!input.bankAccountId?.trim() || !input.cashAccountId?.trim() ||
      !(input.effectiveFrom instanceof Date) || !Number.isFinite(input.effectiveFrom.getTime()) ||
      (input.effectiveTo != null && (!Number.isFinite(input.effectiveTo.getTime()) || input.effectiveTo < input.effectiveFrom))) {
    throw new Error('BANK_MAPPING_INPUT_INVALID');
  }
  return db.$transaction(async tx => {
    await requireFinanceRole(tx, actor);
    const bank = await tx.bankAccount.findFirst({
      where: { id: input.bankAccountId, organizationId: actor.organizationId, active: true },
    });
    const cash = await tx.account.findFirst({
      where: { id: input.cashAccountId, organizationId: actor.organizationId, active: true, systemPurpose: 'CASH' },
    });
    if (!bank || !cash) throw new Error('BANK_MAPPING_ACCOUNT_INVALID');
    if (cash.effectiveFrom > input.effectiveFrom ||
        (cash.effectiveTo && (!input.effectiveTo || cash.effectiveTo < input.effectiveTo))) {
      throw new Error('BANK_MAPPING_ACCOUNT_NOT_EFFECTIVE');
    }
    const created = await tx.bankCashMapping.create({
      data: {
        organizationId: actor.organizationId, bankAccountId: bank.id, cashAccountId: cash.id,
        preparedById: actor.actorId, effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
      },
    });
    await tx.auditEvent.create({
      data: { organizationId: actor.organizationId, actorId: actor.actorId,
        action: 'BANK_MAPPING_PROPOSED', entityType: 'BankCashMapping', entityId: created.id,
        correlationId: created.id, newState: { bankAccountId: bank.id, cashAccountId: cash.id } },
    });
    return { mappingId: created.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function approveBankCashMapping(db: PrismaClient, actor: BankMappingActor, mappingId: string) {
  requireContext(actor);
  if (!mappingId?.trim()) throw new Error('BANK_MAPPING_ID_REQUIRED');
  return db.$transaction(async tx => {
    await requireFinanceRole(tx, actor);
    const mapping = await tx.bankCashMapping.findFirst({
      where: { id: mappingId, organizationId: actor.organizationId },
      include: { bankAccount: true, cashAccount: true },
    });
    if (!mapping || mapping.approvedAt || mapping.revokedAt || mapping.preparedById === actor.actorId) {
      throw new Error('BANK_MAPPING_APPROVAL_DENIED');
    }
    if (!mapping.bankAccount.active || !mapping.cashAccount.active ||
        mapping.bankAccount.organizationId !== actor.organizationId ||
        mapping.cashAccount.organizationId !== actor.organizationId ||
        mapping.cashAccount.systemPurpose !== 'CASH') throw new Error('BANK_MAPPING_ACCOUNT_INVALID');
    if (mapping.cashAccount.effectiveFrom > mapping.effectiveFrom ||
        (mapping.cashAccount.effectiveTo && (!mapping.effectiveTo || mapping.cashAccount.effectiveTo < mapping.effectiveTo))) {
      throw new Error('BANK_MAPPING_ACCOUNT_NOT_EFFECTIVE');
    }
    const overlaps = await tx.bankCashMapping.count({
      where: {
        organizationId: actor.organizationId, bankAccountId: mapping.bankAccountId,
        id: { not: mapping.id }, approvedAt: { not: null }, revokedAt: null,
        effectiveFrom: { lte: mapping.effectiveTo ?? new Date('9999-12-31') },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: mapping.effectiveFrom } }],
      },
    });
    if (overlaps) throw new Error('BANK_MAPPING_OVERLAP');
    const approvedAt = new Date();
    const result = await tx.bankCashMapping.updateMany({
      where: { id: mapping.id, organizationId: actor.organizationId, approvedAt: null, revokedAt: null },
      data: { approvedById: actor.actorId, approvedAt },
    });
    if (result.count !== 1) throw new Error('BANK_MAPPING_APPROVAL_CONFLICT');
    await tx.auditEvent.create({
      data: { organizationId: actor.organizationId, actorId: actor.actorId,
        action: 'BANK_MAPPING_APPROVED', entityType: 'BankCashMapping', entityId: mapping.id,
        correlationId: mapping.id, newState: { approvedById: actor.actorId, approvedAt: approvedAt.toISOString() } },
    });
    return { mappingId: mapping.id, approvedAt };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function revokeBankCashMapping(db: PrismaClient, actor: BankMappingActor, mappingId: string) {
  requireContext(actor);
  if (!mappingId?.trim()) throw new Error('BANK_MAPPING_ID_REQUIRED');
  return db.$transaction(async tx => {
    await requireFinanceRole(tx, actor);
    const revokedAt = new Date();
    const result = await tx.bankCashMapping.updateMany({
      where: { id: mappingId, organizationId: actor.organizationId, revokedAt: null },
      data: { revokedAt },
    });
    if (result.count !== 1) throw new Error('BANK_MAPPING_REVOCATION_CONFLICT');
    await tx.auditEvent.create({
      data: { organizationId: actor.organizationId, actorId: actor.actorId,
        action: 'BANK_MAPPING_REVOKED', entityType: 'BankCashMapping', entityId: mappingId,
        correlationId: mappingId, newState: { revokedAt: revokedAt.toISOString() } },
    });
    return { mappingId, revokedAt };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
