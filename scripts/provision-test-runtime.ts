import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

// Provision/regrant only a non-owner role on an explicit disposable loopback test database.
if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test required");
const owner = new URL(requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL));
const runtime = new URL(requireIsolatedTestDatabaseUrl(process.env.TEST_RUNTIME_DATABASE_URL));
if (owner.host !== runtime.host || owner.pathname !== runtime.pathname || owner.search !== runtime.search || owner.username === runtime.username) throw new Error("Runtime must target the same isolated database with a distinct role");
const role = decodeURIComponent(runtime.username);
const password = decodeURIComponent(runtime.password);
if (!/^[a-z][a-z0-9_]*$/.test(role) || password.length < 16) throw new Error("Invalid test runtime credentials");
const schema = owner.searchParams.get("schema") ?? "public";
if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error("Invalid schema");
const db = new PrismaClient({ datasourceUrl: owner.toString() });
try {
  const existing = await db.$queryRaw<Array<{ rolname: string }>>`SELECT rolname FROM pg_roles WHERE rolname=${role}`;
  if (existing.length) {
    const check = new PrismaClient({ datasourceUrl: runtime.toString() });
    try {
      const [roleState] = await check.$queryRaw<Array<{ unsafe: boolean }>>`SELECT (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolinherit OR EXISTS (SELECT 1 FROM pg_auth_members WHERE member=pg_roles.oid)) AS unsafe FROM pg_roles WHERE rolname=current_user`;
      if (!roleState || roleState.unsafe) throw new Error("Unsafe existing test runtime role");
    } finally { await check.$disconnect(); }
  } else await db.$executeRawUnsafe(`CREATE ROLE "${role}" LOGIN PASSWORD '${password.replaceAll("'", "''")}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`);
  await db.$executeRawUnsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${role}"`);
  const manifest = JSON.parse(readFileSync("docs/tenant-rls-manifest.json", "utf8")) as { tenantTables: Array<{ table: string }> };
  for (const { table } of manifest.tenantTables) {
    if (!/^[A-Za-z]+$/.test(table)) throw new Error("Invalid manifest table");
    await db.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON "${schema}"."${table}" TO "${role}"`);
  }
  // Shared catalog data is read-only; authentication stores remain inaccessible.
  await db.$executeRawUnsafe(`GRANT SELECT ON "${schema}"."Currency", "${schema}"."AgentDefinition" TO "${role}"`);
  await db.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schema}" TO "${role}"`);
  await db.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION "${schema}".planora_session_tenant() TO "${role}"`);
  const columns = await db.$queryRaw<Array<{ column_name: string }>>`SELECT column_name FROM information_schema.columns WHERE table_schema=${schema} AND table_name='User' AND column_name <> 'passwordHash'`;
  const names = columns.map(({ column_name }) => `"${column_name.replaceAll('"', '""')}"`).join(",");
  await db.$executeRawUnsafe(`GRANT SELECT (${names}) ON "${schema}"."User" TO "${role}"`);
  console.log("Isolated non-owner test runtime role provisioned.");
} finally { await db.$disconnect(); }
