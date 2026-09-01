import { randomUUID } from "node:crypto";
import { AppError } from "./errors";

export function correlationId(request?: Request) {
  return request?.headers.get("x-correlation-id") ?? randomUUID();
}

export function logEvent(event: string, details: Record<string, unknown>) {
  console.info(JSON.stringify({ level: "info", event, timestamp: new Date().toISOString(), ...details }));
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && forwardedHost && new URL(origin).host !== forwardedHost) throw new AppError("FORBIDDEN", "Cross-origin mutation was denied.", 403);
}

export function seeOther(location: string) { return new Response(null, { status: 303, headers: { Location: location } }); }
