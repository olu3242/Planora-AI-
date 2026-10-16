export function canReturnExistingMatch(input:{authorized:boolean;mappingValid:boolean;bankMatched:boolean;sameJournal:boolean}):boolean {
 return input.authorized && input.mappingValid && input.bankMatched && input.sameJournal;
}
