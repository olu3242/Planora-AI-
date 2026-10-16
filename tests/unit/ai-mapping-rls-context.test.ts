import { describe, expect, it, vi } from "vitest";
import { withMappingTenant } from "../../src/lib/accounting/ai-mapping-tenant-transaction";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
describe("tenant-scoped query transaction integration contract", () => {
  it("sets context before tenant query on same connection", async () => {
    const calls: string[] = [];
    const tx = {
      $queryRaw: vi.fn(async () => { calls.push("context"); return []; }),
      aiTransactionMappingWorkItem: { findMany: vi.fn(async () => { calls.push("query"); return [{ id: "work-a" }]; }) },
    };
    const db = { $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>) => fn(tx) };
    const rows = await withMappingTenant(db, tenantA, async conn => {
      return (conn as typeof tx).aiTransactionMappingWorkItem.findMany();
    });
    expect(rows).toEqual([{ id: "work-a" }]);
    expect(calls).toEqual(["context", "query"]);
  });
  it("keeps context inside transaction and reinitializes per tenant", async () => {
    const observed: string[] = [];
    const tx = {
      $queryRaw: vi.fn(async (_strings: TemplateStringsArray, id: string) => { observed.push(id); return []; }),
    };
    const db = { $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>) => fn(tx) };
    await withMappingTenant(db, tenantA, async () => undefined);
    await withMappingTenant(db, tenantB, async () => undefined);
    expect(observed).toEqual([tenantA, tenantB]);
  });
  it("propagates query failures without falling back to an unscoped read", async () => {
    const tx = { $queryRaw: vi.fn(async () => { throw new Error("RLS_UNAVAILABLE"); }) };
    const db = { $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>) => fn(tx) };
    await expect(withMappingTenant(db, tenantA, async () => "unscoped")).rejects.toThrow("RLS_UNAVAILABLE");
  });
});
