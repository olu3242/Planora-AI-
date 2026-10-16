export function isApprovedBankMapping(input: {organizationId:string; bankOrganizationId:string; cashOrganizationId:string; approved:boolean; revoked:boolean; currency:string; cashCurrency:string}):boolean {
 return Boolean(input.approved && !input.revoked && input.organizationId === input.bankOrganizationId && input.organizationId === input.cashOrganizationId && input.currency === input.cashCurrency && /^[A-Z]{3}$/.test(input.currency));
}
