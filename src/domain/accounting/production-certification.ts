export type ProductionGate=Readonly<{id:string;passed:boolean;evidence:string}>;
export type ProductionDecision=Readonly<{decision:"GO"|"NO_GO";blockers:readonly string[]}>;
export function classifyProductionCertification(gates:readonly ProductionGate[]):ProductionDecision{
 const blockers=gates.filter(g=>!g.passed||!g.evidence.trim()).map(g=>g.id);
 return{decision:blockers.length?"NO_GO":"GO",blockers:[...new Set(blockers)].sort()};
}
export function requiredAccountingProductionGates():readonly string[]{
 return["WAVE_A","WAVE_B","WAVE_C","WAVE_D","WAVE_E","WAVE_F","WAVE_G","WAVE_H","WAVE_I","GOLDEN_ACCOUNTING_JOURNEY","ZERO_UNEXPLAINED_DIFFERENCE","COVERAGE","BUILD","SECURITY","E2E"];
}