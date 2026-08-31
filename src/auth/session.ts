import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { env } from "@/validation/env";
import { AppError } from "@/lib/errors";
import type { Permission } from "@/permissions/permissions";
import { hasPermission } from "@/permissions/permissions";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, membershipId: string) {
  const token = randomBytes(32).toString("base64url");
  const config = env();
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash: tokenHash(token), userId, membershipId, expiresAt } });
  const store = await cookies();
  store.set(config.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.APP_ENV === "production" || config.APP_ENV === "preview",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const config = env();
  const store = await cookies();
  const token = store.get(config.SESSION_COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  store.delete(config.SESSION_COOKIE_NAME);
}

export async function getSession() {
  const config = env();
  const token = (await cookies()).get(config.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active) return null;
  const membership = await prisma.organizationMembership.findUnique({
    where: { id: session.membershipId },
    include: { organization: true },
  });
  if (!membership || !membership.active || membership.userId !== session.userId) return null;
  return { sessionId: session.id, user: session.user, membership, organization: membership.organization };
}

export async function requirePageSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireApiSession(permission?: Permission) {
  const session = await getSession();
  if (!session) throw new AppError("AUTHENTICATION_REQUIRED", "Authentication is required.", 401);
  if (permission && !hasPermission(session.membership.role, permission)) throw new AppError("FORBIDDEN", "You do not have permission for this action.", 403);
  return session;
}
