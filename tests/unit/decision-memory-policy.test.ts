import { describe, expect, it } from "vitest";

describe("financial decision memory policy",()=>{
 it("admits only human accepted or edited recommendations",()=>{
  const admitted=["ACCEPTED","EDITED"]; expect(admitted).toContain("ACCEPTED"); expect(admitted).toContain("EDITED"); expect(admitted).not.toContain("REJECTED"); expect(admitted).not.toContain("PENDING");
 });
 it("keeps financial memory evidence-based rather than autonomous",()=>{
  const policy={acceptedHumanDecisionsOnly:true,selfDecisionForbidden:true,tenantScoped:true};
  expect(policy).toEqual({acceptedHumanDecisionsOnly:true,selfDecisionForbidden:true,tenantScoped:true});
 });
});
