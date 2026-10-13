import{validateAccountingProposal,validateProposalDecision,type AccountingProposal,type ProposalDecision}from"./agent-proposal";
export type IntelligenceDependency="C_WAVE"|"D_WAVE"|"E_WAVE"|"F_WAVE"|"G_WAVE"|"H_WAVE";
export type IntelligenceAssessment=Readonly<{proposalId:string;risk:"LOW"|"MEDIUM"|"HIGH";requiresHumanReview:boolean;anomalies:readonly string[];status:"ELIGIBLE_FOR_REVIEW"|"BLOCKED";blockers:readonly string[]}>;
export function assessAccountingIntelligence(i:Readonly<{proposal:AccountingProposal;dependencies:Readonly<Record<IntelligenceDependency,"PASS"|"BLOCKED"|"DEFERRED">>;sourceAmountMinor:bigint;historicalMedianMinor:bigint;materialityMinor:bigint}>):IntelligenceAssessment{
 validateAccountingProposal(i.proposal);if(i.sourceAmountMinor<0n||i.historicalMedianMinor<0n||i.materialityMinor<0n)throw new Error("INVALID_INTELLIGENCE_AMOUNT");
 const blockers:string[]=[];for(const[k,v]of Object.entries(i.dependencies))if(v!=="PASS")blockers.push(`${k}_NOT_CERTIFIED`);
 const anomalies:string[]=[];const delta=i.sourceAmountMinor>=i.historicalMedianMinor?i.sourceAmountMinor-i.historicalMedianMinor:i.historicalMedianMinor-i.sourceAmountMinor;if(delta>i.materialityMinor)anomalies.push("MATERIAL_AMOUNT_DEVIATION");
 const lowConfidence=i.proposal.confidenceBasisPoints<9000;const material=i.sourceAmountMinor>=i.materialityMinor;const requiresHumanReview=lowConfidence||material||anomalies.length>0;
 const risk=material||anomalies.length?"HIGH":lowConfidence?"MEDIUM":"LOW";return{proposalId:i.proposal.id,risk,requiresHumanReview,anomalies,status:blockers.length?"BLOCKED":"ELIGIBLE_FOR_REVIEW",blockers:[...new Set(blockers)].sort()};
}
export function approveIntelligenceProposal(p:AccountingProposal,d:ProposalDecision,a:IntelligenceAssessment):Readonly<{proposalId:string;decision:"APPROVE"|"REJECT";reviewedBy:string;postingAuthorized:false}>{
 validateProposalDecision(p,d);if(a.proposalId!==p.id)throw new Error("ASSESSMENT_PROPOSAL_MISMATCH");if(a.status==="BLOCKED")throw new Error("INTELLIGENCE_DEPENDENCIES_BLOCKED");return Object.freeze({proposalId:p.id,decision:d.action,reviewedBy:d.reviewerId,postingAuthorized:false});
}
export function assertAiCannotPost(result:Readonly<{postingAuthorized:boolean}>):void{if(result.postingAuthorized)throw new Error("AI_POSTING_AUTHORITY_FORBIDDEN")}
