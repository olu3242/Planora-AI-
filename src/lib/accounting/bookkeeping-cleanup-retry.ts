export function cleanupRetryDelay(attempt: number): number {
  if (!Number.isSafeInteger(attempt) || attempt < 1) throw new Error("INVALID_ATTEMPT");
  return Math.min(3600000, 1000 * 2 ** Math.min(attempt - 1, 12));
}
export function cleanupNextAction(attempt: number, code: string, maxAttempts = 5): "RETRY" | "ESCALATE" {
  if (attempt >= maxAttempts || ["CLEANUP_SCAN_INCOMPLETE", "READINESS_SCOPE_NOT_FOUND"].includes(code)) return "ESCALATE";
  return "RETRY";
}
