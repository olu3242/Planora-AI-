import { createHash } from "node:crypto";

export type FactDimensions = { legalEntityId?: string; businessUnitId?: string; geographyId?: string; productId?: string; customerId?: string; costCenterId?: string };
const dimensionNames: (keyof FactDimensions)[] = ["legalEntityId", "businessUnitId", "geographyId", "productId", "customerId", "costCenterId"];

export function dimensionKey(dimensions: FactDimensions) {
  return dimensionNames.map((name) => `${name}:${dimensions[name] ?? "_"}`).join("|");
}

export function financialFactGrain(input: FactDimensions & { accountId: string; fiscalPeriodId: string; scenario: string; currencyCode: string; sourceIdentifier: string; versionContext: string }) {
  const canonical = [input.accountId, input.fiscalPeriodId, input.scenario, input.currencyCode, input.sourceIdentifier, input.versionContext, dimensionKey(input)].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export type MetricLineage = { metric: string; formula: string; value: string; inputs: Array<MetricLineage | { factId: string; amount: string; sourceType: string; sourceIdentifier: string; sourceLocation: unknown }> };
