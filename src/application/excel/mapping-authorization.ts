import type { Permission } from "@/permissions/permissions";

export type MappingDecisionIdentifier = { ruleId: string } | { suggestionId: string };

export function requiredMappingPermission(input: MappingDecisionIdentifier): Permission {
  return "suggestionId" in input ? "mapping.approve" : "mapping.review";
}
