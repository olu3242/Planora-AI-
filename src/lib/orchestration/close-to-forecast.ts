import type { WorkflowDefinition } from "./types";

export const CLOSE_TO_FORECAST_WORKFLOW: WorkflowDefinition = {
  id: "accounting-close-to-forecast",
  version: 1,
  steps: [
    { id: "preflight", kind: "DETERMINISTIC" },
    { id: "bank-reconciliation", kind: "DATABASE", dependsOn: ["preflight"] },
    { id: "ap-validation", kind: "DATABASE", dependsOn: ["preflight"] },
    { id: "ar-validation", kind: "DATABASE", dependsOn: ["preflight"] },
    {
      id: "trial-balance",
      kind: "DETERMINISTIC",
      dependsOn: ["bank-reconciliation", "ap-validation", "ar-validation"],
    },
    { id: "close-analysis", kind: "AGENT", dependsOn: ["trial-balance"] },
    {
      id: "controller-approval",
      kind: "HUMAN_APPROVAL",
      dependsOn: ["close-analysis"],
      requiresApproval: true,
    },
    { id: "period-close", kind: "DATABASE", dependsOn: ["controller-approval"] },
    { id: "actuals-sync", kind: "DATABASE", dependsOn: ["period-close"] },
    { id: "forecast-refresh", kind: "AGENT", dependsOn: ["actuals-sync"] },
    { id: "insight-generation", kind: "AGENT", dependsOn: ["forecast-refresh"] },
  ],
};
