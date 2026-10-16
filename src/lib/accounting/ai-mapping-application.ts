import type { MappingDecision } from "./ai-mapping-engine";
import type { AiMappingRepository } from "./ai-mapping-repository";
import { reviewMapping, type ReviewAction } from "./ai-mapping-review";
import { routeMapping } from "./ai-mapping-routing";

export type MappingPrincipal = Readonly<{
  userId: string;
  organizationId: string;
  roles: readonly ("BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER" | "PLATFORM_ADMIN")[];
}>;
export type MappingAccount = Readonly<{
  id: string;
  organizationId: string;
  active: boolean;
}>;
export type MappingApplicationDependencies = Readonly<{
  repository: AiMappingRepository;
  /** Must load the persisted proposal, never a client-provided proposal. */
  loadProposal: (organizationId: string, proposalKey: string) => Promise<MappingDecision | null>;
  /** Must query active eligible accounts from the authenticated organization. */
  loadEligibleAccounts: (organizationId: string, transactionId: string) => Promise<readonly MappingAccount[]>;
  /** Must reflect durable review state, not caller input. */
  hasReview: (organizationId: string, proposalKey: string) => Promise<boolean>;
}>;
const roles = ["BOOKKEEPER", "ACCOUNTANT", "CONTROLLER", "PLATFORM_ADMIN"] as const;
function assertPrincipal(principal: MappingPrincipal): void {
  if (!principal.userId || !principal.organizationId || !principal.roles.some(r => roles.includes(r))) {
    throw new Error("FORBIDDEN_MAPPING_ACCESS");
  }
}
/** Server-only application boundary. Caller must derive principal from verified session. */
export function createMappingApplication(deps: MappingApplicationDependencies) {
  return {
    async enqueue(principal: MappingPrincipal, decision: MappingDecision) {
      assertPrincipal(principal);
      if (decision.tenantId !== principal.organizationId) throw new Error("TENANT_MISMATCH");
      const workItem = routeMapping(decision);
      return deps.repository.saveProposalAndWorkItem({
        decision, workItem, authenticatedTenantId: principal.organizationId,
      });
    },
    async queue(principal: MappingPrincipal) {
      assertPrincipal(principal);
      const permitted = new Set<string>();
      if (principal.roles.includes("BOOKKEEPER")) permitted.add("BOOKKEEPER");
      if (principal.roles.includes("ACCOUNTANT")) permitted.add("ACCOUNTANT");
      if (principal.roles.includes("CONTROLLER")) permitted.add("CONTROLLER");
      if (principal.roles.includes("PLATFORM_ADMIN")) {
        permitted.add("BOOKKEEPER"); permitted.add("ACCOUNTANT"); permitted.add("CONTROLLER");
      }
      const results = await Promise.all(
        [...permitted].map(assignedRole => deps.repository.listWorkItems({
          authenticatedTenantId: principal.organizationId,
          assignedRole: assignedRole as "BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER",
        })),
      );
      return results.flat();
    },
    async review(principal: MappingPrincipal, input: {
      proposalKey: string;
      action: ReviewAction;
      selectedAccountId: string | null;
      reason: string;
    }) {
      assertPrincipal(principal);
      if (!principal.roles.some(r => r === "ACCOUNTANT" || r === "CONTROLLER" || r === "PLATFORM_ADMIN")) {
        throw new Error("FORBIDDEN_MAPPING_REVIEW");
      }
      const proposal = await deps.loadProposal(principal.organizationId, input.proposalKey);
      if (!proposal || proposal.tenantId !== principal.organizationId) throw new Error("MAPPING_PROPOSAL_NOT_FOUND");
      const [accounts, previouslyReviewed] = await Promise.all([
        deps.loadEligibleAccounts(principal.organizationId, proposal.transactionId),
        deps.hasReview(principal.organizationId, input.proposalKey),
      ]);
      const review = reviewMapping(proposal, input.action, input.selectedAccountId, input.reason, {
        authenticatedTenantId: principal.organizationId,
        reviewerId: principal.userId,
        reviewerCanReview: true,
        previouslyReviewed,
        allowedAccountIds: accounts.filter(a => a.active && a.organizationId === principal.organizationId).map(a => a.id),
      });
      await deps.repository.recordReview({ review, authenticatedTenantId: principal.organizationId });
      return { proposalKey: review.proposalKey, action: review.action };
    },
  };
}
