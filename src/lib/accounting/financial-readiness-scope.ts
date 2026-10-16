/** Reject entity/period pairs that cannot be traced to the authenticated organization. */
export function assertReadinessScopeOwnership(input: {
  organizationId: string;
  legalEntity: { organizationId: string; active: boolean } | null;
  fiscalPeriod: { fiscalYear: { fiscalCalendar: { organizationId: string } } } | null;
}) {
  if (!input.legalEntity || !input.legalEntity.active ||
      input.legalEntity.organizationId !== input.organizationId ||
      !input.fiscalPeriod ||
      input.fiscalPeriod.fiscalYear.fiscalCalendar.organizationId !== input.organizationId) {
    throw new Error("READINESS_SCOPE_NOT_FOUND");
  }
}
