import { minorUnitsFromDecimal } from './financial-fact-minor-units';
export type LedgerAllocationSource=Readonly<{organizationId:string;legalEntityId:string|null;fiscalPeriodId:string;accountId:string;currencyCode:string;sourceIdentifier:string;costCenterId:string|null;amount:string;sourceMetadata:unknown}>;
export function verifyLedgerAllocationSource(source:LedgerAllocationSource,scope:Readonly<{organizationId:string;legalEntityId:string;fiscalPeriodId:string;accountId:string;currencyCode:string;sourceIdentifier:string}>,minorUnits:number):bigint{
 if(source.organizationId!==scope.organizationId||source.legalEntityId!==scope.legalEntityId||source.fiscalPeriodId!==scope.fiscalPeriodId||source.accountId!==scope.accountId||source.currencyCode!==scope.currencyCode||source.sourceIdentifier!==scope.sourceIdentifier)throw new Error('ALLOCATION_LEDGER_SOURCE_SCOPE_MISMATCH');
 if(source.costCenterId!==null)throw new Error('ALLOCATION_LEDGER_SOURCE_ALREADY_DIMENSIONED');
 if(!source.sourceMetadata||typeof source.sourceMetadata!=='object'||Array.isArray(source.sourceMetadata)||(source.sourceMetadata as Record<string,unknown>).origin!=='POSTED_LEDGER')throw new Error('ALLOCATION_LEDGER_SOURCE_NOT_POSTED');
 return minorUnitsFromDecimal(source.amount,minorUnits);
}
