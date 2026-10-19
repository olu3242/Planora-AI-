export const MAX_CLEANUP_ROWS = 10000;
export function validateCleanupRowCount(count: number) {
 if (!Number.isSafeInteger(count) || count < 0 || count > MAX_CLEANUP_ROWS) throw new Error("Cleanup batch exceeds permitted row count.");
 return count;
}
