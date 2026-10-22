export type CleanupCsvRow = { id: string; date: string; amountMinor: number; currency: string; description: string; reference?: string };
/** CSV import is intentionally unsupported until robust quoting and size guards are implemented. */
export function isCleanupJsonArray(input: string): boolean {
 try { return Array.isArray(JSON.parse(input)); } catch { return false; }
}
