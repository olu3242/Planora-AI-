import { PrismaClient } from "@prisma/client";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test required for RLS provisioning.");
const ownerUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const runtimeUrl = requireIsolatedTestDatabaseUrl(process.env.TEST_RUNTIME_DATABASE_URL);
const owner = new URL(ownerUrl);
const runtime = new URL(runtimeUrl);
if (owner.hostname !== runtime.hostname || owner.port !== runtime.port || owner.pathname !== runtime.pathname) {
  throw new Error("RLS runtime must target the same isolated loopback test database.");
}
if (runtime.username !== "planora_rls_runtime_test" || runtime.username === owner.username || !runtime.password) {
  throw new Error("RLS runtime must use dedicated non-owner test credentials.");
}
if (runtime.searchParams.get("schema") !== (owner.searchParams.get("schema") || "public")) {
  throw new Error("RLS runtime schema must match the isolated owner schema.");
}
const db = new PrismaClient({ datasourceUrl: ownerUrl });
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
try {
  const role = runtime.username;
  const password = decodeURIComponent(runtime.password);
  const existing = await db.$queryRaw<Array<{ exists: boolean }>>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'planora_rls_runtime_test') AS exists`;
  if (!existing[0]?.exists) {
    await db.$executeRawUnsafe(`CREATE ROLE "${role}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD ${quote(password)}`);
  } else {
    await db.$executeRawUnsafe(`ALTER ROLE "${role}" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD ${quote(password)}`);
  }
  const databaseName = decodeURIComponent(owner.pathname.slice(1));
  await db.$executeRawUnsafe(`GRANT CONNECT ON DATABASE "${databaseName.replaceAll('"', '""')}" TO "${role}"`);
  await db.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO "${role}"`);
  await db.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`);
  await db.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${role}"`);
  await db.$executeRawUnsafe(`REVOKE ALL ON TABLE public."User", public."Session" FROM "${role}"`);
  await db.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${role}"`);
  await db.$executeRawUnsafe(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO "${role}"`);
  const [check] = await db.$queryRaw<Array<{ superuser: boolean; bypass: boolean; createdb: boolean; createrole: boolean }>>`SELECT rolsuper AS superuser, rolbypassrls AS bypass, rolcreatedb AS createdb, rolcreaterole AS createrole FROM pg_roles WHERE rolname='planora_rls_runtime_test'`;
  if (!check || Object.values(check).some(Boolean)) throw new Error("Unsafe RLS runtime role.");
  const [ownership] = await db.$queryRaw<Array<{ ownsTables: boolean; inheritsOwner: boolean }>>`SELECT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relkind='r' AND c.relowner=(SELECT oid FROM pg_roles WHERE rolname='planora_rls_runtime_test')) AS "ownsTables", pg_has_role('planora_rls_runtime_test', current_user, 'MEMBER') AS "inheritsOwner"`;
  if (!ownership || ownership.ownsTables || ownership.inheritsOwner) throw new Error("RLS runtime cannot own tenant tables or inherit the database owner.");
  process.stdout.write("Provisioned restricted local test role; RLS assertions remain mandatory.\n");
} finally {
  await db.$disconnect();
}
