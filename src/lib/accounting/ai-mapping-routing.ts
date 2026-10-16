import type { MappingDecision } from "./ai-mapping-engine";
export type MappingWorkItem = Readonly<{
  key: string;
  tenantId: string;
  transactionId: string;
  assignedRole: "BOOKKEEPER" | "ACCOUNTANT" | "CONTROLLER";
  state: "READY_FOR_VALIDATION" | "WAITING_REVIEW" | "BLOCKED_EXCEPTION";
  priority: "NORMAL" | "HIGH";
  reason: string;
}>;
export function routeMapping(decision: MappingDecision): MappingWorkItem {
  const exception = decision.route === "EXCEPTION";
  return {
    key: decision.idempotencyKey, tenantId: decision.tenantId,
    transactionId: decision.transactionId,
    assignedRole: exception ? "ACCOUNTANT" : decision.agent === "GL" ? "CONTROLLER" : "BOOKKEEPER",
    state: exception ? "BLOCKED_EXCEPTION" : decision.route === "HUMAN_REVIEW" ? "WAITING_REVIEW" : "READY_FOR_VALIDATION",
    priority: exception ? "HIGH" : "NORMAL",
    reason: decision.explanation,
  };
}
