export type DashboardContent = { id: string; label: string; title: string; description: string; subtitle: string; metrics: readonly (readonly [string, string])[]; queue: readonly string[] };
export type SolutionContent = { title: string; text: string; view: number; steps: readonly string[] };
export type CustomerCategory = { title: string; text: string };
export type VideoChapter = { title: string; src: string; poster?: string };

// Public preview content only. These figures never enter the canonical model.
// Replace customer stories only with verified, permissioned customer evidence.
export const dashboardViews = [
  { id: "command", label: "Command Center", title: "Finance Command Center", description: "Overview of your entire finance operation", subtitle: "One view of finance operations, approvals and AI execution.", metrics: [["Workflows", "38"], ["Pending approvals", "7"], ["Automation rate", "84%"], ["Exceptions", "12"]], queue: ["Bank reconciliation completed", "Invoice exception requires approval", "Month-end close in progress"] },
  { id: "accounting", label: "Accounting", title: "Accounting workspace", description: "Bookkeeping, journals and month-end close", subtitle: "From source transactions to a review-ready ledger.", metrics: [["Matched items", "96%"], ["Draft journals", "12"], ["Review items", "8"], ["Close progress", "92%"]], queue: ["Review matched bank transactions", "Inspect journal supporting evidence", "Request independent approval"] },
  { id: "tax", label: "Tax & Compliance", title: "Tax & compliance preview", description: "Filing, deadlines and compliance tracking", subtitle: "A preview of obligations, workpapers and review status.", metrics: [["Upcoming deadlines", "3"], ["Workpapers", "6"], ["Review items", "5"], ["Documents", "24"]], queue: ["Review tax categorization", "Check the filing checklist", "Validate supporting documents"] },
  { id: "fpa", label: "FP&A Intelligence", title: "Planning & forecasting", description: "Cash flow, forecasts and scenario modeling", subtitle: "Connect assumptions, financial evidence and your next decision.", metrics: [["Forecasts", "4"], ["Scenarios", "3"], ["Variance alerts", "2"], ["Reviews pending", "7"]], queue: ["Compare forecast scenarios", "Review operating expenses", "Inspect cash assumptions"] },
  { id: "agents", label: "AI Agents", title: "Governed agent workspace", description: "Agent execution, approvals and governance", subtitle: "AI proposes. Your team reviews and decides.", metrics: [["Agent runs", "24"], ["Awaiting approval", "2"], ["Exceptions", "3"], ["Reviewed", "19"]], queue: ["Reconciliation agent: review needed", "Bookkeeping agent: draft prepared", "Close agent: awaiting approval"] },
] as const;

export const solutionCards = [
  { title: "Bank reconciliation", text: "Match transactions and identify discrepancies automatically.", view: 1, steps: ["Bring together bank and ledger records", "Review matches and investigate exceptions", "Approve the supported reconciliation"] },
  { title: "Month-end close", text: "Coordinate tasks, journals and approvals.", view: 1, steps: ["Review the close checklist", "Prepare journals with source evidence", "Request independent approval"] },
  { title: "Tax compliance", text: "Prepare workpapers and track deadlines.", view: 2, steps: ["Organize supporting records", "Review classifications and obligations", "Prepare workpapers for qualified review"] },
  { title: "Cash-flow forecasting", text: "Model scenarios and understand your runway.", view: 3, steps: ["Review actuals and cash assumptions", "Compare illustrative scenarios", "Submit the forecast for approval"] },
  { title: "AI agents", text: "Observe execution, approvals and exceptions.", view: 4, steps: ["Inspect source inputs and evidence", "Review the proposed recommendation", "Record the human decision"] },
] as const;

export const customerCategories = [
  { title: "SMEs & growing businesses", text: "Daily bookkeeping, payments, taxes and cash-flow visibility." },
  { title: "Accounting firms", text: "Multi-client workspaces, reconciliations and compliance workflows." },
  { title: "Enterprise finance teams", text: "Multi-entity operations, close management and reporting." },
  { title: "Merchants & informal businesses", text: "Simple recordkeeping, transaction capture and localized tax workflows." },
] as const;

export function trackShowcase(component: string, action: string, item: string) {
  // No cookies, identifiers or network requests. An app may subscribe to this
  // documented event after configuring its consent-aware analytics provider.
  window.dispatchEvent(new CustomEvent("planora:showcase", { detail: { component, action, item } }));
}

export const videoChapters: readonly VideoChapter[] = ["Your finance dashboard", "A connected workspace", "Finding insights", "Performance at a glance", "AI Insights in focus", "Meet Planora"].map((title, i) => ({ title, src: `/media/planora/walkthrough-${i + 1}.mp4`, poster: "/media/planora/walkthrough-poster.png" }));
