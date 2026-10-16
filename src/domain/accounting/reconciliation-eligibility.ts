export function reconciliationEligible(x: {sameTenant:boolean;sameEntity:boolean;sameCurrency:boolean;mappingApproved:boolean;bankUnmatched:boolean;journalPosted:boolean;journalAvailable:boolean;bankAmount:bigint;cashAmount:bigint}):boolean {
 return x.sameTenant && x.sameEntity && x.sameCurrency && x.mappingApproved && x.bankUnmatched && x.journalPosted && x.journalAvailable && x.bankAmount !== 0n && x.bankAmount === x.cashAmount;
}
