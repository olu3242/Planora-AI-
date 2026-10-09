import {executeFramework} from "./framework-engine.mjs";
export function certifyDraft({config,entries,period,mappings,expected,disclosureEvidence=[]}){
 const output=executeFramework({config,entries,period,mappings});
 const checks={balanced:output.checks.ledgerBalanced,mapped:output.checks.allAccountsMapped,frameworkCompatible:output.checks.frameworkMappingValid,expectedAmountsVerified:false,disclosuresReviewed:false};
 if(Array.isArray(expected)&&expected.length>0){
  checks.expectedAmountsVerified=expected.every(e=>Number.isSafeInteger(e.amountMinor)&&output.statements.some(s=>s.name===e.statement&&s.sections.some(x=>x.section===e.section&&x.amountMinor===e.amountMinor)));
 }
 checks.disclosuresReviewed=Array.isArray(disclosureEvidence)&&disclosureEvidence.length>0&&disclosureEvidence.every(x=>typeof x.reference==="string"&&x.reference.trim()&&x.reviewed===true);
 return {framework:config.framework,period,checks,status:Object.values(checks).every(Boolean)?"DRAFT_CHECKS_PASSED_NOT_COMPLIANCE_CERTIFIED":"BLOCKED",limitations:["This verifies sample amounts and disclosure attestations, not authoritative recognition, measurement or complete standards coverage"]};
}
