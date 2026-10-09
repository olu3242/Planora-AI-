import { describe, expect, it } from "vitest";
import { assertSuspenseTransition, canTransitionSuspense, suspenseIdentifier } from "../../src/domain/accounting/suspense";

describe("suspense account controls",()=>{
 it("creates a deterministic process identifier",()=>{
  const input={organizationId:"org-1",legalEntityId:"entity-1",fiscalPeriodId:"2026-10",sourceType:"bank",sourceId:"txn 99"};
  expect(suspenseIdentifier(input)).toBe("SUS:ORG-1:ENTITY-1:2026-10:BANK:TXN-99");
  expect(suspenseIdentifier(input)).toBe(suspenseIdentifier(input));
 });
 it("permits only the next governed stage",()=>{
  expect(canTransitionSuspense("CAPTURED","IDENTIFIED")).toBe(true);
  expect(canTransitionSuspense("CAPTURED","CLEARED")).toBe(false);
  expect(()=>assertSuspenseTransition("PROPOSED","CLEARED")).toThrow("INVALID_SUSPENSE_TRANSITION");
 });
});
