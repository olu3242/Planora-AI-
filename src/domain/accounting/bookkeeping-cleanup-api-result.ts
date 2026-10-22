export function cleanupProposalMessage(duplicate: boolean): string {
 return duplicate ? "Existing proposal returned." : "Proposal submitted.";
}
