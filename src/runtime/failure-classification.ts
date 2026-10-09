import { AppError } from "@/lib/errors";

export type FailureCategory = "TRANSIENT" | "VALIDATION" | "AUTHORIZATION" | "DATA_INTEGRITY" | "DEPENDENCY" | "LOGIC" | "UNKNOWN";

export function classifyFailure(error: unknown): FailureCategory {
  if (error instanceof AppError) {
    if (["AUTHENTICATION_REQUIRED", "FORBIDDEN", "RESOURCE_NOT_FOUND"].includes(error.code)) return "AUTHORIZATION";
    if (["VALIDATION_ERROR", "CONFLICT", "VERSION_LOCKED"].includes(error.code)) return "VALIDATION";
  }
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  if (["P2002", "P2003", "P2025"].includes(code)) return "DATA_INTEGRITY";
  if (["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(code)) return "TRANSIENT";
  if (["ECONNREFUSED", "SERVICE_UNAVAILABLE"].includes(code)) return "DEPENDENCY";
  if (error instanceof TypeError || error instanceof RangeError) return "LOGIC";
  return "UNKNOWN";
}

export function mayRetry(category: FailureCategory, retrySafe: boolean, attempt: number, maxAttempts: number) {
  return retrySafe && attempt < maxAttempts && (category === "TRANSIENT" || category === "DEPENDENCY");
}
