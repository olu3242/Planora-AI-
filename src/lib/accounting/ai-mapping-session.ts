import "server-only";
import { requireApiSession } from "@/auth/session";
import { assertMappingAccess, type MappingAccessAction } from "./ai-mapping-access";
import type { MappingPrincipal } from "./ai-mapping-application";

/** Caller must derive identity from Planora's validated server-side session. */
export async function requireMappingPrincipal(action: MappingAccessAction): Promise<MappingPrincipal> {
  const session = await requireApiSession(action === "review" ? "mapping.approve" : "financial.read");
  const roles = assertMappingAccess(session.membership.role, action);
  return {
    userId: session.user.id,
    organizationId: session.organization.id,
    roles,
  };
}
