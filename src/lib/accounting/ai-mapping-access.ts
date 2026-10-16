import type { RoleCode } from "@prisma/client";
import { hasPermission } from "@/permissions/permissions";
import type { MappingPrincipal } from "./ai-mapping-application";

export type MappingAccessAction = "read" | "review";
export function mappingRolesFor(role: RoleCode): MappingPrincipal["roles"] {
  if (role === "CFO") return ["CONTROLLER", "ACCOUNTANT"];
  if (role === "FPA_DIRECTOR") return ["ACCOUNTANT"];
  if (role === "ANALYST") return ["BOOKKEEPER"];
  return [];
}
export function assertMappingAccess(role: RoleCode, action: MappingAccessAction): MappingPrincipal["roles"] {
  const permission = action === "review" ? "mapping.approve" : "financial.read";
  if (!hasPermission(role, permission)) throw new Error("FORBIDDEN_MAPPING_ACCESS");
  const roles = mappingRolesFor(role);
  if (!roles.length) throw new Error("FORBIDDEN_MAPPING_ACCESS");
  if (action === "review" && !roles.some(r => r === "ACCOUNTANT" || r === "CONTROLLER")) {
    throw new Error("FORBIDDEN_MAPPING_REVIEW");
  }
  return roles;
}
