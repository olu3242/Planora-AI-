import { AgentKillSwitch, RoleCode } from "@prisma/client";
import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { assertSameOrigin, correlationId, seeOther } from "@/lib/request";
import { errorResponse } from "@/lib/errors";
import { createPilotOrganization, deactivatePilotMembership, preparePilot, setAgentState, setPilotOrganizationActive, upsertPilotMembership } from "@/application/platform-admin/platform-admin-service";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-organization"), code: z.string(), name: z.string().min(2) }),
  z.object({ action: z.literal("set-organization-active"), organizationId: z.uuid(), active: z.union([z.boolean(), z.enum(["true", "false"])]).transform((value) => value === true || value === "true") }),
  z.object({ action: z.literal("upsert-membership"), organizationId: z.uuid(), email: z.email(), name: z.string().min(2), role: z.enum([RoleCode.ANALYST, RoleCode.FPA_DIRECTOR, RoleCode.CFO]) }),
  z.object({ action: z.literal("deactivate-membership"), membershipId: z.uuid() }),
  z.object({ action: z.literal("set-agent-state"), agentId: z.uuid(), state: z.enum([AgentKillSwitch.ENABLED, AgentKillSwitch.READ_ONLY, AgentKillSwitch.DISABLED]) }),
  z.object({ action: z.literal("prepare-pilot"), organizationId: z.uuid() }),
]);

export async function POST(request: Request) {
  const cid = correlationId(request);
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("admin.manage");
    const json = request.headers.get("content-type")?.includes("application/json");
    const input = schema.parse(json ? await request.json() : Object.fromEntries(await request.formData()));
    const context = { role: session.membership.role, actorId: session.user.id, auditOrganizationId: session.organization.id, correlationId: cid };
    if (input.action === "create-organization") await createPilotOrganization(context, input);
    if (input.action === "set-organization-active") await setPilotOrganizationActive(context, input.organizationId, input.active);
    if (input.action === "upsert-membership") await upsertPilotMembership(context, input);
    if (input.action === "deactivate-membership") await deactivatePilotMembership(context, input.membershipId);
    if (input.action === "set-agent-state") await setAgentState(context, input.agentId, input.state);
    if (input.action === "prepare-pilot") await preparePilot(context, input.organizationId);
    return json ? Response.json({ ok: true, correlationId: cid }) : seeOther("/platform-admin?success=1");
  } catch (error) { return errorResponse(error, cid); }
}
