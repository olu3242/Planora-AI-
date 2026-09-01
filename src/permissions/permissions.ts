import type { RoleCode } from "@prisma/client";

export const permissions = [
  "financial.read", "financial.write", "financial.import", "mapping.review", "mapping.approve",
  "reconciliation.run", "reconciliation.certify", "forecast.create", "forecast.submit",
  "forecast.review", "forecast.approve", "forecast.publish", "forecast.export", "audit.read", "admin.manage",
] as const;
export type Permission = (typeof permissions)[number];

const grants: Record<RoleCode, ReadonlySet<Permission>> = {
  CFO: new Set(permissions.filter((p) => p !== "admin.manage")),
  FPA_DIRECTOR: new Set(permissions.filter((p) => p !== "admin.manage")),
  ANALYST: new Set(["financial.read", "financial.write", "financial.import", "mapping.review", "reconciliation.run", "forecast.create", "forecast.submit"]),
  PLATFORM_ADMIN: new Set(["audit.read", "admin.manage"]),
};

export function hasPermission(role: RoleCode, permission: Permission) {
  return grants[role].has(permission);
}

export function assertPermission(role: RoleCode, permission: Permission) {
  if (!hasPermission(role, permission)) {
    const error = new Error(`Missing permission: ${permission}`);
    error.name = "ForbiddenError";
    throw error;
  }
}
