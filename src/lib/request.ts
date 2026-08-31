import { randomUUID } from "node:crypto";

export function correlationId(request?: Request) {
  return request?.headers.get("x-correlation-id") ?? randomUUID();
}

export function logEvent(event: string, details: Record<string, unknown>) {
  console.info(JSON.stringify({ level: "info", event, timestamp: new Date().toISOString(), ...details }));
}
