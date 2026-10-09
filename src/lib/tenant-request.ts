import "server-only";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { requireApiSession, requirePageSession } from "@/auth/session";
import { env } from "@/validation/env";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { inTenantTransaction } from "@/lib/prisma";
import { withTenantSession } from "@/lib/tenant-database";

let runtime: PrismaClient | undefined;
async function scoped<T>(work: () => Promise<T>) {
  const url = process.env.RUNTIME_DATABASE_URL;
  if (!url) throw new Error("RUNTIME_DATABASE_URL_REQUIRED");
  runtime ??= new PrismaClient({ datasourceUrl: url });
  const token = (await cookies()).get(env().SESSION_COOKIE_NAME)?.value;
  if (!token) throw new AppError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  return withTenantSession(runtime, token, tx => inTenantTransaction(tx, work));
}

export function withTenantApi<A extends [Request, ...unknown[]]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      await requireApiSession("financial.read");
      return await scoped(() => handler(...args));
    } catch (error) { return errorResponse(error, correlationId(args[0])); }
  };
}

export function withTenantPage<A extends unknown[], T>(page: (...args: A) => Promise<T>) {
  return async (...args: A): Promise<T> => {
    const session = await requirePageSession();
    // Operational admin pages expose no financial authority. Their service has
    // its own server-side role gate and uses the explicit bootstrap connection.
    if (session.membership.role === "PLATFORM_ADMIN") return page(...args);
    return scoped(() => page(...args));
  };
}
