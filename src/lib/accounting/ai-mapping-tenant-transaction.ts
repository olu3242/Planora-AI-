/**
 * Run mapping SQL under a transaction-local tenant context. The caller MUST
 * obtain organizationId from a verified server session, not request input.
 * Uses parameterized SQL; SET LOCAL context is cleared on transaction end.
 */
export interface TenantTransactionClient {
  $transaction<T>(fn: (tx: TenantTransactionConnection) => Promise<T>): Promise<T>;
}
export interface TenantTransactionConnection {
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
}
export async function withMappingTenant<T>(
  client: TenantTransactionClient,
  authenticatedOrganizationId: string,
  callback: (tx: TenantTransactionConnection) => Promise<T>,
): Promise<T> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authenticatedOrganizationId)) {
    throw new Error("INVALID_AUTHENTICATED_ORGANIZATION_ID");
  }
  return client.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('app.organization_id', ${authenticatedOrganizationId}, true)`;
    return callback(tx);
  });
}
