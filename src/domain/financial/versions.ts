export const protectedPlanStatuses = new Set(["APPROVED", "LOCKED"]);
export const protectedForecastStatuses = new Set(["PUBLISHED", "SUPERSEDED"]);

export function assertVersionMutable(kind: "plan" | "forecast", status: string) {
  const protectedStatuses = kind === "plan" ? protectedPlanStatuses : protectedForecastStatuses;
  if (protectedStatuses.has(status)) {
    const error = new Error(`${kind} version is immutable; create a correction draft`);
    error.name = "VersionLockedError"; throw error;
  }
}

export function correctionDraft(version: number, protectedVersionId: string, reason: string) {
  if (!reason.trim()) throw new Error("A correction reason is required");
  return { version: version + 1, status: "DRAFT" as const, correctionOfId: protectedVersionId, reason: reason.trim() };
}
