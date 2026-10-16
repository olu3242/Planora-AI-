import "server-only";
import { NextResponse } from "next/server";
import { previewLiveReadiness } from "@/lib/accounting/financial-readiness-live-preflight";

/** Read-only uncertified live diagnostic. Never creates or approves snapshots. */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const result = await previewLiveReadiness(params.get("legalEntityId") ?? "", params.get("fiscalPeriodId") ?? "");
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "AUTHENTICATION_REQUIRED" ? 401 :
      code.startsWith("FORBIDDEN") ? 403 :
      code === "INVALID_READINESS_SCOPE" ? 400 :
      code === "READINESS_SCOPE_NOT_FOUND" ? 404 : 503;
    const message = status === 503 ? "READINESS_PREFLIGHT_UNAVAILABLE" : code;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
