import { withTenantApi } from "@/lib/tenant-request";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { writeAudit } from "@/audit/audit";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId } from "@/lib/request";
import { CLOSE_TO_FORECAST_WORKFLOW } from "@/lib/orchestration/close-to-forecast";
import { PrismaWorkflowRunStore } from "@/lib/orchestration/prisma-store";
import { startWorkflow } from "@/lib/orchestration/service";

const inputSchema=z.object({legalEntityId:z.string().uuid(),fiscalPeriodId:z.string().uuid()});
async function handlePOST(request:Request){
 const cid=correlationId(request);
 try{
  assertSameOrigin(request);
  const session=await requireApiSession("financial.write");
  const input=inputSchema.safeParse(await request.json());
  if(!input.success) throw new AppError("VALIDATION_ERROR","Valid legal entity and fiscal period are required.",400);
  const runId=randomUUID();
  const store=new PrismaWorkflowRunStore();
  const run=await startWorkflow(CLOSE_TO_FORECAST_WORKFLOW,runId,{organizationId:session.organization.id,legalEntityId:input.data.legalEntityId,fiscalPeriodId:input.data.fiscalPeriodId,actorId:session.user.id,correlationId:cid},{actorId:session.user.id,organizationId:session.organization.id,canStart:true,canApprove:false},store);
  await writeAudit(prisma,{organizationId:session.organization.id,actorId:session.user.id,action:"ORCHESTRATION.START",entityType:"WorkflowRun",entityId:run.id,newState:{status:run.status,definitionId:run.definitionId},correlationId:cid});
  return Response.json({runId:run.id,status:run.status},{status:201});
 }catch(error){return errorResponse(error,cid);}
}

export const POST = withTenantApi(handlePOST);
