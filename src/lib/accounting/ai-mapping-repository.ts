import type { MappingDecision } from "./ai-mapping-engine";
import type { MappingReview } from "./ai-mapping-review";
import type { MappingWorkItem } from "./ai-mapping-routing";

/** Implement this port with tenant-filtered Prisma queries and DB uniqueness constraints. */
export interface AiMappingRepository {
  saveProposalAndWorkItem(input: {
    decision: MappingDecision;
    workItem: MappingWorkItem;
    authenticatedTenantId: string;
  }): Promise<{ proposalKey: string; created: boolean }>;
  recordReview(input: {
    review: MappingReview;
    authenticatedTenantId: string;
  }): Promise<void>;
  listWorkItems(input: {
    authenticatedTenantId: string;
    assignedRole: MappingWorkItem["assignedRole"];
  }): Promise<readonly MappingWorkItem[]>;
}
export function assertMappingTenant(expected: string, authenticated: string): void {
  if (!authenticated || expected !== authenticated) throw new Error("TENANT_MISMATCH");
}
