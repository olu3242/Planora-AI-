import { Prisma, type PrismaClient } from '@prisma/client';

/** Execute tenant operations with transaction-local, validated identity. */
export async function withBankMappingTenant<T>(
  db: PrismaClient,
  trusted: { organizationId: string; actorId: string },
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trusted.organizationId) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trusted.actorId)) {
    throw new Error('TRUSTED_TENANT_IDENTITY_REQUIRED');
  }
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT set_config('app.organization_id', ${trusted.organizationId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.actor_id', ${trusted.actorId}, true)`;
    return work(tx);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
