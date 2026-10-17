import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test required.");
const url = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = new PrismaClient({ datasourceUrl: url });
try {
  const migrationName = "20261009060000_tenant_rls";
  const migrationSql = readFileSync(`prisma/migrations/${migrationName}/migration.sql`);
  const checksum = createHash("sha256").update(migrationSql).digest("hex");
  const migrationRows = await db.$queryRaw<Array<{ migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
    SELECT migration_name, checksum, finished_at, rolled_back_at
    FROM public._prisma_migrations WHERE migration_name = ${migrationName}`;
  if (migrationRows.length !== 1 || !migrationRows[0].finished_at || migrationRows[0].rolled_back_at) {
    throw new Error("TENANT_RLS_MIGRATION_NOT_APPLIED");
  }
  if (migrationRows[0].checksum !== checksum) {
    throw new Error("TENANT_RLS_MIGRATION_CHECKSUM_MISMATCH");
  }
  const functions = await db.$queryRaw<Array<{ schema: string; name: string; args: string; returns: string }>>`
    SELECT n.nspname AS schema, p.proname AS name,
      pg_get_function_identity_arguments(p.oid) AS args,
      pg_get_function_result(p.oid) AS returns
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.proname = 'planora_session_tenant'
    ORDER BY n.nspname, p.oid`;
  const exact = functions.some(f => f.schema === "public" && f.name === "planora_session_tenant" && f.args === "");
  if (!exact) {
    process.stderr.write("Required public.planora_session_tenant() function absent after migrations.\n");
    process.stderr.write("Discovered matching signatures: " + JSON.stringify(functions) + "\n");
    throw new Error("TENANT_SESSION_MIGRATION_MISSING");
  }
  const manifest = JSON.parse(readFileSync("docs/tenant-rls-manifest.json", "utf8")) as { tenantTables: Array<{ table: string }> };
  if (manifest.tenantTables.length !== 56 || new Set(manifest.tenantTables.map(t => t.table)).size !== 56) {
    throw new Error("TENANT_RLS_MANIFEST_INVALID");
  }
  const catalog = await db.$queryRaw<Array<{ name: string; enabled: boolean; forced: boolean }>>`
    SELECT c.relname AS name, c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'`;
  const missing = manifest.tenantTables.map(t => t.table).filter(table => !catalog.some(row => row.name === table && row.enabled && row.forced));
  if (missing.length) throw new Error("TENANT_RLS_POLICY_MISSING: " + missing.join(", "));
  const policies = await db.$queryRaw<Array<{ name: string; count: bigint }>>`
    SELECT c.relname AS name, COUNT(p.oid)::bigint AS count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid=c.oid
    WHERE n.nspname='public' AND c.relkind='r'
    GROUP BY c.relname`;
  const noPolicies = manifest.tenantTables.map(t => t.table).filter(table =>
    !policies.some(row => row.name === table && row.count > 0n));
  if (noPolicies.length) throw new Error("TENANT_RLS_POLICY_DEFINITION_MISSING: " + noPolicies.join(", "));
  const [functionGrant] = await db.$queryRaw<Array<{ ownerCanExecute: boolean }>>`
    SELECT has_function_privilege(current_user, 'public.planora_session_tenant()', 'EXECUTE') AS "ownerCanExecute"`;
  if (!functionGrant?.ownerCanExecute) throw new Error("TENANT_SESSION_FUNCTION_NOT_EXECUTABLE");
  if (process.argv.includes("--runtime")) {
    const runtimeUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_RUNTIME_DATABASE_URL);
    const runtime = new URL(runtimeUrl);
    const owner = new URL(url);
    if (runtime.hostname !== owner.hostname || runtime.port !== owner.port || runtime.pathname !== owner.pathname ||
        runtime.username !== "planora_rls_runtime_test" || runtime.username === owner.username) {
      throw new Error("TENANT_RUNTIME_DATABASE_MISMATCH");
    }
    const runtimeDb = new PrismaClient({ datasourceUrl: runtimeUrl });
    try {
      const [runtimeGrant] = await runtimeDb.$queryRaw<Array<{ executable: boolean }>>`
        SELECT has_function_privilege(current_user, 'public.planora_session_tenant()', 'EXECUTE') AS executable`;
      if (!runtimeGrant?.executable) throw new Error("TENANT_SESSION_RUNTIME_EXECUTE_DENIED");
    } finally {
      await runtimeDb.$disconnect();
    }
  }

  process.stdout.write("Tenant session function and forced RLS on 56 manifest tables verified in isolated test database.\n");
} finally {
  await db.$disconnect();
}
