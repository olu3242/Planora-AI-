import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { writeAudit } from "@/audit/audit";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { assertSameOrigin, correlationId } from "@/lib/request";
import { PrismaWorkflowRunStore } from "@/lib/orchestration/prisma-store";
import { approveWorkflowStep } from "@/lib/orchestration/service";

const inputSchema=z.object({stepId:z.string().min(1),evidenceId:z.string().min(1)});
export async function POST(request:Request,{params}:{params:Promise<{runId:string}>}){
 const cid=correlationId(request);
 try{
  assertSameOrigin(request);
  const session=await requireApiSession("accounting.close.approve");
  const input=inputSchema.safeParse(await request.json());
  if(!input.success) throw new AppError("VALIDATION_ERROR","Step and approval evidence are required.",400);
  const {runId}=await params;
  const store=new PrismaWorkflowRunStore();
  const before=await store.load(runId);
  if(!before) throw new AppError("RESOURCE_NOT_FOUND","Workflow run not found.",404);
  const run=await approveWorkflowStep(runId,input.data.stepId,input.data.evidenceId,{actorId:session.user.id,organizationId:session.organization.id,canStart:false,canApprove:true},store);
  await writeAudit(prisma,{organizationId:session.organization.id,actorId:session.user.id,action:"ORCHESTRATION.APPROVE",entityType:"WorkflowRun",entityId:run.id,previousState:{status:before.status,stepId:input.data.stepId},newState:{status:run.status,stepStatus:run.steps[input.data.stepId]?.status},metadata:{evidenceId:input.data.evidenceId},correlationId:cid});
  return Response.json({runId:run.id,status:run.status,stepStatus:run.steps[input.data.stepId]?.status});
 }catch(error){return errorResponse(error,cid);}
}
