import "server-only";
import { requireApiSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import type { MappingPrincipal } from "./ai-mapping-application";

/**
 * Derives identity exclusively from Planora's validated cookie-backed session.
 * Existing RoleCode is CFO/FPA_DIRECTOR/ANALYST/PLATFORM_ADMIN, not the
 * conceptual BOOKKEEPER/ACCOUNTANT/CONTROLLER roles.
 * Translation is explicit and conservative until persona grants are migrated.
 */
export async function requireMappingPrincipal(
  action: "read" | "review",
): Promise<MappingPrincipal> {
  const session = await requireApiSession(action === "review" ? "mapping.approve" : "financial.read");
  const role = session.membership.role;
  if (action === "review" && !hasPermission(role, "mapping.approve")) throw new Error("FORBIDDEN_MAPPING_REVIEW");
  if (action === "read" && !hasPermission(role, "financial.read")) throw new Error("FORBIDDEN_MAPPING_ACCESS");
  const roles: MappingPrincipal["roles"][number][] =
    role === "CFO" ? ["CONTROLLER", "ACCOUNTANT"] :
    role === "FPA_DIRECTOR" ? ["ACCOUNTANT"] :
    role === "ANALYST" ? ["BOOKKEEPER"] : [];
  if (!roles.length) throw new Error("FORBIDDEN_MAPPING_ACCESS");
  return {
    userId: session.user.id,
    organizationId: session.organization.id,
    roles,
  };
}
