import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Resolve a principal from a server-received session token, never from request JSON. */
export async function resolveAccountingPrincipal(db: PrismaClient, sessionToken: string) {
  if (!sessionToken || sessionToken.length < 32) throw new Error("AUTHENTICATION_REQUIRED");
  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { membership: true },
  });
  if (!session || session.expiresAt <= new Date() ||
      !session.membership.active || session.membership.userId !== session.userId) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }
  return {
    userId: session.userId,
    organizationId: session.membership.organizationId,
    role: session.membership.role,
  };
}
