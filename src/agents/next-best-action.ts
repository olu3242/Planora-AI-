import type { ForecastVersionStatus, RoleCode } from "@prisma/client";

export type NextActionContext = {
  role: RoleCode;
  status: ForecastVersionStatus;
  blockingErrors: number;
  warningCount: number;
  lineCount: number;
  commentaryCount: number;
};

export type NextAction = { code: string; label: string; reason: string; requiresHumanAction: true };

export function nextBestActions(context: NextActionContext): NextAction[] {
  if (context.blockingErrors > 0) return [{ code: "RESOLVE_VALIDATION", label: "Resolve blocking validation errors", reason: `${context.blockingErrors} blocking validation issue${context.blockingErrors === 1 ? "" : "s"} prevent submission.`, requiresHumanAction: true }];
  if (context.lineCount === 0) return [{ code: "IMPORT_FORECAST", label: "Import forecast data", reason: "The forecast has no financial lines.", requiresHumanAction: true }];
  if (context.role === "ANALYST") {
    if (["DRAFT", "REVISION_REQUIRED"].includes(context.status) && context.commentaryCount === 0) return [{ code: "ADD_COMMENTARY", label: "Add supported commentary", reason: "The forecast has no version-level commentary.", requiresHumanAction: true }];
    if (["DRAFT", "REVISION_REQUIRED"].includes(context.status)) return [{ code: "SUBMIT_FORECAST", label: context.status === "REVISION_REQUIRED" ? "Resubmit forecast" : "Submit forecast", reason: "Validation is clear and commentary is present. Submission still requires explicit human action.", requiresHumanAction: true }];
    return [{ code: "WAIT_FOR_REVIEW", label: "Wait for authorized review", reason: `The forecast is ${context.status.replaceAll("_", " ").toLowerCase()}; the Analyst has no permitted review transition.`, requiresHumanAction: true }];
  }
  if (context.status === "SUBMITTED") return [{ code: "START_REVIEW", label: "Begin review", reason: "A submitted forecast is awaiting an authorized reviewer.", requiresHumanAction: true }];
  if (context.status === "IN_REVIEW") return [{ code: "REVIEW_EXCEPTION", label: "Review material movements and commentary", reason: `${context.warningCount} warning${context.warningCount === 1 ? "" : "s"} and the approval decision require human judgment.`, requiresHumanAction: true }];
  if (context.role === "CFO" && context.status === "APPROVED") return [{ code: "FINAL_REVIEW", label: "Perform final review", reason: "The forecast is Director-approved; only the CFO may explicitly lock it.", requiresHumanAction: true }];
  return [{ code: "NO_WORKFLOW_ACTION", label: "No workflow action available", reason: `No governed transition is available for ${context.role} while the forecast is ${context.status}.`, requiresHumanAction: true }];
}
