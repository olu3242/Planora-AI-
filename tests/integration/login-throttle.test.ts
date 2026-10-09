import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { assertLoginAllowed, recordLoginFailure } from "@/auth/login-throttle";

const prisma = new PrismaClient();
const key = "integration-login-throttle";
afterAll(async () => { await prisma.loginThrottle.deleteMany({ where: { key } }); await prisma.$disconnect(); });

describe("login throttle", () => {
  it("blocks the sixth attempt inside the policy window", async () => {
    await prisma.loginThrottle.deleteMany({ where: { key } });
    const now = new Date("2026-08-31T12:00:00.000Z");
    for (let count = 0; count < 5; count += 1) await recordLoginFailure(key, new Date(now.getTime() + count));
    await expect(assertLoginAllowed(key, new Date(now.getTime() + 10))).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });
});
