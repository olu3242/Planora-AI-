import { withTenantApi } from "@/lib/tenant-request";
import { requireApiSession } from "@/auth/session";
import { writeAudit } from "@/audit/audit";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId } from "@/lib/request";
import { accountingRuntimeRegistry } from "@/lib/orchestration/accounting-runtime";
import { CLOSE_TO_FORECAST_WORKFLOW } from "@/lib/orchestration/close-to-forecast";
import { PrismaRuntimeExecutionStore, PrismaWorkflowRunStore } from "@/lib/orchestration/prisma-store";
import { resumeWorkflow } from "@/lib/orchestration/service";

async function handlePOST(request:Request,{params}:{params:Promise<{runId:string}>}){
 const cid=correlationId(request);
 try{
  assertSameOrigin(request);
  const session=await requireApiSession("financial.write");
  const {runId}=await params;
  const runs=new PrismaWorkflowRunStore();
  const before=await runs.load(runId);
  if(!before) throw new AppError("RESOURCE_NOT_FOUND","Workflow run not found.",404);
  const run=await resumeWorkflow(CLOSE_TO_FORECAST_WORKFLOW,runId,{actorId:session.user.id,organizationId:session.organization.id,canStart:true,canApprove:false},runs,new PrismaRuntimeExecutionStore(),accountingRuntimeRegistry());
  await writeAudit(prisma,{organizationId:session.organization.id,actorId:session.user.id,action:"ORCHESTRATION.RESUME",entityType:"WorkflowRun",entityId:run.id,previousState:{status:before.status},newState:{status:run.status},correlationId:cid});
  return Response.json({runId:run.id,status:run.status,steps:run.steps});
 }catch(error){return errorResponse(error,cid);}
}

export const POST = withTenantApi(handlePOST);
