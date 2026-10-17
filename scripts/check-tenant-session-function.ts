import { PrismaClient } from "@prisma/client";
import { requireIsolatedTestDatabaseUrl } from "./test-database-url";

if (process.env.APP_ENV !== "test") throw new Error("APP_ENV=test required.");
const url = requireIsolatedTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = new PrismaClient({ datasourceUrl: url });
try {
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
  process.stdout.write("Tenant session function present in isolated test database.\n");
} finally {
  await db.$disconnect();
}
