import "server-only";
import { createHash } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";

/** Cookie tokens come from the server's authenticated request, never a tenant ID.
 * PostgreSQL independently checks session expiry, user and membership state.
 * Every operation stays inside this transaction so pooled context cannot leak.
 */
export async function withTenantSession<T>(
  db: PrismaClient,
  sessionToken: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!sessionToken || sessionToken.length < 32) throw new Error("DATABASE_SESSION_REQUIRED");
  return db.$transaction(async tx => {
    const [role] = await tx.$queryRaw<Array<{ unsafe: boolean }>>`
      SELECT (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR
        EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname=current_schema() AND c.relkind='r' AND pg_has_role(current_user,c.relowner,'MEMBER'))
      ) AS unsafe FROM pg_roles r WHERE r.rolname=current_user`;
    if (!role || role.unsafe) throw new Error("UNSAFE_RUNTIME_DATABASE_ROLE");
    const digest = createHash("sha256").update(sessionToken).digest("hex");
    await tx.$queryRaw`SELECT set_config('planora.session_hash', ${digest}, true)`;
    const [context] = await tx.$queryRaw<Array<{ tenant: string | null }>>`SELECT planora_session_tenant()::text AS tenant`;
    if (!context?.tenant) throw new Error("DATABASE_SESSION_INVALID");
    return operation(tx);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 60000 });
}
