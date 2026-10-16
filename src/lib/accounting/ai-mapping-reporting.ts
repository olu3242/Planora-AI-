import type { MappingDecision } from "./ai-mapping-engine";
export type ReportingAccount = Readonly<{
  id: string; tenantId: string; active: boolean;
  statementClass: "PROFIT_AND_LOSS" | "BALANCE_SHEET" | "STATISTICAL";
  reportingLineId: string | null;
}>;
export type ReportingClassification = Readonly<{
  transactionId: string; accountId: string; statementClass: ReportingAccount["statementClass"];
  reportingLineId: string; status: "PROPOSED";
}>;
/** Reporting proposals never publish statements or change the GL. */
export function proposeReportingClassification(
  decision: MappingDecision,
  accounts: readonly ReportingAccount[],
): ReportingClassification {
  if (!decision.accountId || decision.route === "EXCEPTION") throw new Error("MAPPING_UNRESOLVED");
  const account = accounts.find(a => a.id === decision.accountId && a.tenantId === decision.tenantId && a.active);
  if (!account?.reportingLineId) throw new Error("REPORTING_MAPPING_MISSING");
  return {
    transactionId: decision.transactionId, accountId: account.id,
    statementClass: account.statementClass, reportingLineId: account.reportingLineId,
    status: "PROPOSED",
  };
}
