import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const windowMs = 15 * 60 * 1000;
const maximumFailures = 5;

export function loginThrottleKey(email: string, request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || "local";
  return createHash("sha256").update(`${email.toLowerCase()}|${address}`).digest("hex");
}

export async function assertLoginAllowed(key: string, now = new Date()) {
  const throttle = await prisma.loginThrottle.findUnique({ where: { key } });
  if (throttle?.blockedUntil && throttle.blockedUntil > now) {
    throw new AppError("RATE_LIMITED", "Too many sign-in attempts. Try again later.", 429);
  }
}

export async function recordLoginFailure(key: string, now = new Date()) {
  const existing = await prisma.loginThrottle.findUnique({ where: { key } });
  const expired = !existing || now.getTime() - existing.windowStartedAt.getTime() >= windowMs;
  const failedCount = expired ? 1 : existing.failedCount + 1;
  const blockedUntil = failedCount >= maximumFailures ? new Date(now.getTime() + windowMs) : null;
  await prisma.loginThrottle.upsert({
    where: { key },
    create: { key, failedCount, windowStartedAt: now, blockedUntil },
    update: { failedCount, windowStartedAt: expired ? now : existing.windowStartedAt, blockedUntil },
  });
}

export async function clearLoginFailures(key: string) {
  await prisma.loginThrottle.deleteMany({ where: { key } });
}
