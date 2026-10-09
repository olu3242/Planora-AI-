import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { withTenantSession } from "@/lib/tenant-database";
import { requireIsolatedTestDatabaseUrl } from "../../scripts/test-database-url";

const owner = new PrismaClient();
const runtime = new PrismaClient({ datasourceUrl: requireIsolatedTestDatabaseUrl(process.env.TEST_RUNTIME_DATABASE_URL) });
const tables: string[] = JSON.parse(readFileSync("docs/tenant-rls-manifest.json", "utf8")).tenantTables.map((x: { table: string }) => x.table);
const tokenA = randomBytes(32).toString("base64url");
const tokenB = randomBytes(32).toString("base64url");
let tenantA: string, tenantB: string, membershipA: string;
beforeAll(async () => {
  for (const [email, token] of [["cfo@planora.local", tokenA], ["cfo@horizon.local", tokenB]]) {
    const user = await owner.user.findUniqueOrThrow({ where: { email }, include: { memberships: true } });
    const membership = user.memberships[0];
    if (token === tokenA) { tenantA = membership.organizationId; membershipA = membership.id; } else tenantB = membership.organizationId;
    await owner.session.create({ data: { userId: user.id, membershipId: membership.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now()+3600000) } });
  }
});
afterAll(async () => { await owner.$disconnect(); await runtime.$disconnect(); });

describe("forced PostgreSQL tenant policies using a non-owner runtime role", () => {
  it("forces policies on all 56 tenant tables and denies reads without session identity", async () => {
    const catalog = await runtime.$queryRaw<Array<{ name: string; enabled: boolean; forced: boolean }>>`SELECT c.relname AS name,c.relrowsecurity AS enabled,c.relforcerowsecurity AS forced FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relkind='r'`;
    expect(tables).toHaveLength(56);
    for (const table of tables) {
      expect(catalog.find(row => row.name === table)).toMatchObject({ enabled: true, forced: true });
      // Names originate only from the checked-in manifest, not request input.
      expect(await runtime.$queryRawUnsafe(`SELECT * FROM "${table}"`)).toEqual([]);
    }
  });
  it("does not let caller-provided tenant or role settings establish authority", async () => {
    await runtime.$transaction(async tx => {
      await tx.$queryRaw`SELECT set_config('planora.tenant_id', ${tenantB}, true)`;
      await tx.$queryRaw`SELECT set_config('planora.role', 'CFO', true)`;
      expect(await tx.account.findMany()).toEqual([]);
    });
    await expect(withTenantSession(runtime, randomBytes(32).toString("hex"), tx => tx.account.count())).rejects.toThrow("DATABASE_SESSION_INVALID");
    await expect(withTenantSession(runtime, "", tx => tx.account.count())).rejects.toThrow("DATABASE_SESSION_REQUIRED");
  });
  it("rejects owner credentials and denies runtime access to password/session stores", async () => {
    await expect(withTenantSession(owner, tokenA, tx => tx.account.count())).rejects.toThrow("UNSAFE_RUNTIME_DATABASE_ROLE");
    await expect(runtime.session.findMany()).rejects.toThrow();
    await expect(runtime.user.findMany()).rejects.toThrow();
    await expect(runtime.$executeRawUnsafe('SET ROLE planora_wave1_test')).rejects.toThrow();
    await expect(runtime.$executeRawUnsafe('ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY')).rejects.toThrow();
  });
  it("isolates SELECT, INSERT, UPDATE and DELETE, including attempted tenant reassignment", async () => {
    const foreign = await owner.account.findFirstOrThrow({ where: { organizationId: tenantB } });
    await withTenantSession(runtime, tokenA, async tx => {
      expect(await tx.account.findUnique({ where: { id: foreign.id } })).toBeNull();
      expect((await tx.account.updateMany({ where: { id: foreign.id }, data: { name: "forged" } })).count).toBe(0);
      expect((await tx.account.deleteMany({ where: { id: foreign.id } })).count).toBe(0);
      const local = await tx.account.create({ data: { organizationId: tenantA, code: randomUUID(), name: "RLS CRUD", type: "ASSET", normalBalance: "DEBIT", effectiveFrom: new Date("2026-01-01") } });
      await tx.account.update({ where: { id: local.id }, data: { name: "Updated" } });
      await tx.account.delete({ where: { id: local.id } });
    });
    await expect(withTenantSession(runtime, tokenA, tx => tx.account.create({ data: { organizationId: tenantB, code: randomUUID(), name: "Forbidden", type: "ASSET", normalBalance: "DEBIT", effectiveFrom: new Date("2026-01-01") } }))).rejects.toThrow();
    const local = await owner.account.create({ data: { organizationId: tenantA, code: randomUUID(), name: "Cannot move", type: "ASSET", normalBalance: "DEBIT", effectiveFrom: new Date("2026-01-01") } });
    await expect(withTenantSession(runtime, tokenA, tx => tx.account.update({ where: { id: local.id }, data: { organizationId: tenantB } }))).rejects.toThrow();
    expect((await owner.account.findUniqueOrThrow({ where: { id: foreign.id } })).name).toBe(foreign.name);
  });
  it("protects indirect ownership and cross-tenant foreign references", async () => {
    const foreign = await owner.excelWorkbook.create({ data: { organizationId: tenantB, originalFileName: "foreign.csv", sanitizedFileName: "foreign.csv", mimeType: "text/csv", byteSize: 1, sha256: randomUUID(), content: Buffer.from("x") } });
    const profile = await owner.workbookProfile.create({ data: { workbookId: foreign.id, fingerprint: randomUUID(), primaryShape: "LONG", sheetCount: 1, formulaCount: 0, hiddenSheetCount: 0, mergedCellCount: 0, profile: {} } });
    await withTenantSession(runtime, tokenA, async tx => {
      expect(await tx.workbookProfile.findUnique({ where: { id: profile.id } })).toBeNull();
      expect((await tx.workbookProfile.deleteMany({ where: { id: profile.id } })).count).toBe(0);
    });
    const template = await owner.mappingTemplate.create({ data: { organizationId: tenantA, name: "Own template", fingerprint: randomUUID() } });
    await expect(withTenantSession(runtime, tokenA, tx => tx.mappingVersion.create({ data: { templateId: template.id, workbookId: foreign.id, version: 1, schemaFingerprint: "bad-reference" } }))).rejects.toThrow();
  });
  it("does not leak pooled context across concurrent tenants or rollback", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => withTenantSession(runtime, i%2 ? tokenA : tokenB, async tx => {
      const rows = await tx.account.findMany();
      expect(rows.length).toBeGreaterThan(0);
      return rows.every(row => row.organizationId === (i%2 ? tenantA : tenantB));
    })));
    expect(results.every(Boolean)).toBe(true);
    await expect(withTenantSession(runtime, tokenA, async tx => { await tx.account.count(); throw new Error("rollback-probe"); })).rejects.toThrow("rollback-probe");
    expect(await runtime.account.findMany()).toEqual([]);
  });
  it("revokes authority for inactive memberships and expired sessions", async () => {
    await owner.organizationMembership.update({ where: { id: membershipA }, data: { active: false } });
    try { await expect(withTenantSession(runtime, tokenA, tx => tx.account.count())).rejects.toThrow("DATABASE_SESSION_INVALID"); }
    finally { await owner.organizationMembership.update({ where: { id: membershipA }, data: { active: true } }); }
    await owner.session.update({ where: { tokenHash: createHash("sha256").update(tokenA).digest("hex") }, data: { expiresAt: new Date(0) } });
    await expect(withTenantSession(runtime, tokenA, tx => tx.account.count())).rejects.toThrow("DATABASE_SESSION_INVALID");
  });
});
