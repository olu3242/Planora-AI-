import { describe, expect, it, vi } from "vitest";
import { withMappingTenant } from "../../src/lib/accounting/ai-mapping-tenant-transaction";
const org = "11111111-1111-4111-8111-111111111111";
describe("mapping tenant transaction", () => {
  it("sets transaction-local context before executing tenant query", async () => {
    const order: string[] = [];
    const tx = { $queryRaw: vi.fn(async () => { order.push("context"); return 1; }) };
    const db = { $transaction: async <T>(fn: (t: typeof tx) => Promise<T>) => fn(tx) };
    const result = await withMappingTenant(db, org, async () => { order.push("query"); return "ok"; });
    expect(result).toBe("ok");
    expect(order).toEqual(["context", "query"]);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });
  it("rejects absent organization before opening transaction", async () => {
    const db = { $transaction: vi.fn() };
    await expect(withMappingTenant(db, "", async () => "bad")).rejects.toThrow("INVALID_AUTHENTICATED_ORGANIZATION_ID");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("rejects non-UUID tenant input", async () => {
    const db = { $transaction: vi.fn() };
    await expect(withMappingTenant(db, "tenant'; drop table", async () => "bad")).rejects.toThrow();
  });
});
