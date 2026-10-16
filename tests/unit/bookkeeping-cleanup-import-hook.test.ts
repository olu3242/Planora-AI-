import { describe, expect, it, vi } from "vitest";
import { onCompletedBankImport } from "../../src/lib/accounting/bookkeeping-cleanup-import-hook";
const event = { organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period", importEventId: "event", state: "COMPLETED" as const };
describe("completed bank import cleanup hook", () => {
  it("enqueues completed imports once per invocation", async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined);
    expect(await onCompletedBankImport(event, enqueue)).toBe("ENQUEUED");
    expect(enqueue).toHaveBeenCalledWith({
      organizationId: "org", legalEntityId: "entity", fiscalPeriodId: "period", importEventId: "event",
    });
  });
  it("ignores failed and pending imports", async () => {
    const enqueue = vi.fn();
    expect(await onCompletedBankImport({ ...event, state: "FAILED" }, enqueue)).toBe("IGNORED");
    expect(await onCompletedBankImport({ ...event, state: "PENDING" }, enqueue)).toBe("IGNORED");
    expect(enqueue).not.toHaveBeenCalled();
  });
  it("propagates enqueue errors rather than falsely acknowledging completion", async () => {
    await expect(onCompletedBankImport(event, vi.fn().mockRejectedValue(new Error("DB_DOWN")))).rejects.toThrow("DB_DOWN");
  });
});
