export const errorCodes = [
  "VALIDATION_ERROR", "AUTHENTICATION_REQUIRED", "FORBIDDEN", "RESOURCE_NOT_FOUND",
  "TENANT_BOUNDARY_VIOLATION", "CONFLICT", "RATE_LIMITED", "IMPORT_ERROR", "RECONCILIATION_ERROR", "VERSION_LOCKED",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status = 400) {
    super(message);
  }
}

export function errorResponse(error: unknown, correlationId: string) {
  if (error instanceof AppError) {
    if (error.status >= 403) console.warn(JSON.stringify({ level: "warn", event: "request.denied", correlationId, code: error.code, status: error.status }));
    return Response.json({ error: { code: error.code, message: error.message, correlationId } }, { status: error.status });
  }
  console.error(JSON.stringify({ level: "error", correlationId, message: "Unhandled application error" }));
  return Response.json({ error: { code: "CONFLICT", message: "The request could not be completed.", correlationId } }, { status: 500 });
}
