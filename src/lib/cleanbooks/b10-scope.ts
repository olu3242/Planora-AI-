export type Scope={organizationId:string;legalEntityId:string};
export function requireScope(scope:Scope){if(!scope.organizationId?.trim()||!scope.legalEntityId?.trim())throw Error("CLEANBOOKS_SCOPE_REQUIRED");return scope}
export function assertScoped<T extends Scope>(rows:readonly T[],scope:Scope){requireScope(scope);if(rows.some(r=>r.organizationId!==scope.organizationId||r.legalEntityId!==scope.legalEntityId))throw Error("CLEANBOOKS_CROSS_SCOPE");return rows}
