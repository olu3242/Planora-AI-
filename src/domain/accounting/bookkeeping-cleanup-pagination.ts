export function parseCleanupPageLimit(value: string | null, defaultLimit = 50) {
  if (value === null) return defaultLimit;
  if (!/^[1-9]\d*$/.test(value)) throw new Error("Invalid cleanup page limit.");
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit > 100) throw new Error("Cleanup page limit must be 1-100.");
  return limit;
}
