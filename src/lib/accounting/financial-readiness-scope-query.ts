import { assertReadinessScopeOwnership } from "./financial-readiness-scope";

/** Validate scope inside the same tenant-scoped transaction as any read/write. */
export async function verifyReadinessScopeInTransaction(
  db: {
    legalEntity: { findFirst(args: unknown): Promise<{ organizationId: string; active: boolean } | null> };
    fiscalPeriod: { findUnique(args: unknown): Promise<{ year: { calendar: { organizationId: string } } } | null> };
  },
  organizationId: string,
  legalEntityId: string,
  periodId: string,
): Promise<void> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![organizationId, legalEntityId, periodId].every(value => uuid.test(value))) {
    throw new Error("INVALID_READINESS_SCOPE");
  }
  const [legalEntity, fiscalPeriod] = await Promise.all([
    db.legalEntity.findFirst({
      where: { id: legalEntityId, organizationId, active: true },
      select: { organizationId: true, active: true },
    }),
    db.fiscalPeriod.findUnique({
      where: { id: periodId },
      select: { year: { select: { calendar: { select: { organizationId: true } } } } },
    }),
  ]);
  assertReadinessScopeOwnership({ organizationId, legalEntity, fiscalPeriod });
}
