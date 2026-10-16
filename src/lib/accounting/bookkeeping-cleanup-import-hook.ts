/** Trusted import completion integration point. No client-supplied tenant authorization. */
export type CompletedBankImport = Readonly<{
  organizationId: string;
  legalEntityId: string;
  fiscalPeriodId: string;
  importEventId: string;
  state: "COMPLETED" | "FAILED" | "PENDING";
}>;
export async function onCompletedBankImport(
  event: CompletedBankImport,
  enqueue: (scope: {
    organizationId: string; legalEntityId: string; fiscalPeriodId: string; importEventId: string;
  }) => Promise<unknown>,
): Promise<"ENQUEUED" | "IGNORED"> {
  if (event.state !== "COMPLETED") return "IGNORED";
  await enqueue({
    organizationId: event.organizationId,
    legalEntityId: event.legalEntityId,
    fiscalPeriodId: event.fiscalPeriodId,
    importEventId: event.importEventId,
  });
  return "ENQUEUED";
}
