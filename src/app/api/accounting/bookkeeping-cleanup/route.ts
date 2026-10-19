import { randomUUID } from "node:crypto";
import { z } from "zod";
import { withTenantApi } from "@/lib/tenant-request";
import { requireApiSession } from "@/auth/session";
import { assertSameOrigin, correlationId } from "@/lib/request";
import { errorResponse } from "@/lib/errors";
import { runBookkeepingCleanup } from "@/application/accounting/bookkeeping-cleanup-service";
import { scopeCleanupTransactions } from "@/domain/accounting/bookkeeping-cleanup-payload";

const row = z.object({
  id: z.string().trim().min(1).max(256),
  date: z.string().min(1).max(40),
  amountMinor: z.number().int().safe(),
  currency: z.string().min(1).max(10),
  description: z.string().max(2000),
  reference: z.string().max(256).nullable().optional(),
}).strict();
const schema = z.object({
  batchId: z.string().trim().min(1).max(256),
  idempotencyKey: z.uuid().optional(),
  transactions: z.array(row).max(10000),
}).strict();

async function handlePOST(request: Request) {
  const cid = correlationId(request);
  try {
    assertSameOrigin(request);
    const session = await requireApiSession("financial.import");
    const input = schema.parse(await request.json());
    const result = await runBookkeepingCleanup({
      organizationId: session.organization.id,
      actorId: session.user.id,
      correlationId: cid,
      idempotencyKey: input.idempotencyKey ?? randomUUID(),
      batchId: input.batchId,
    }, input.transactions.map(transaction => ({ ...transaction, organizationId: session.organization.id })));
    return Response.json(result, { status: 201 });
  } catch (error) { return errorResponse(error, cid); }
}
export const POST = withTenantApi(handlePOST);
