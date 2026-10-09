import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/auth/password";
import { createSession } from "@/auth/session";
import { correlationId, logEvent } from "@/lib/request";
import { AppError, errorResponse } from "@/lib/errors";
import { writeAudit } from "@/audit/audit";
import { assertLoginAllowed, clearLoginFailures, loginThrottleKey, recordLoginFailure } from "@/auth/login-throttle";

const inputSchema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  const cid = correlationId(request);
  try {
    const input = inputSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Enter a valid email and password.", 400);
    const throttleKey = loginThrottleKey(input.data.email, request);
    await assertLoginAllowed(throttleKey);
    const user = await prisma.user.findUnique({ where: { email: input.data.email }, include: { memberships: { where: { active: true }, orderBy: { createdAt: "asc" } } } });
    if (!user || !user.active || !(await verifyPassword(input.data.password, user.passwordHash)) || !user.memberships[0]) {
      await recordLoginFailure(throttleKey);
      throw new AppError("AUTHENTICATION_REQUIRED", "Email or password is incorrect.", 401);
    }
    const membership = user.memberships[0];
    await clearLoginFailures(throttleKey);
    await createSession(user.id, membership.id);
    await writeAudit(prisma, { organizationId: membership.organizationId, actorId: user.id, action: "AUTH.LOGIN", entityType: "Session", entityId: user.id, correlationId: cid });
    logEvent("auth.login", { correlationId: cid, organizationId: membership.organizationId, actorId: user.id });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error, cid); }
}
