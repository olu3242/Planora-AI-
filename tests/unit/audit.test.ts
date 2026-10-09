import { describe, expect, it } from "vitest";
import { normalizeAudit } from "@/audit/audit";

describe("audit normalization", () => {
  it("normalizes action and entity without dropping evidence", () => {
    const result = normalizeAudit({ organizationId: "o", actorId: "u", action: " forecast.submit ", entityType: " ForecastVersion ", entityId: "v", correlationId: "c", metadata: { reason: "cycle" } });
    expect(result.action).toBe("FORECAST.SUBMIT"); expect(result.entityType).toBe("ForecastVersion"); expect(result.metadata).toEqual({ reason: "cycle" });
  });
});
