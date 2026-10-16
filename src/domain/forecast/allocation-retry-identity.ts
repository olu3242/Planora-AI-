export function assertAllocationRetryIdentity(expected:Readonly<{grainKey:string;organizationId:string;legalEntityId:string;fiscalPeriodId:string;accountId:string;currencyCode:string;costCenterId:string;sourceIdentifier:string}>,actual:Readonly<{grainKey:string;organizationId:string;legalEntityId:string|null;fiscalPeriodId:string;accountId:string;currencyCode:string;costCenterId:string|null;sourceIdentifier:string}>):void{
 for(const key of ['grainKey','organizationId','legalEntityId','fiscalPeriodId','accountId','currencyCode','costCenterId','sourceIdentifier'] as const){
  if(expected[key]!==actual[key])throw new Error('ALLOCATION_RETRY_IDENTITY_CONFLICT');
 }
}
