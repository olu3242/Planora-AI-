import { requireApiSession } from "@/auth/session";
import { AppError, errorResponse } from "@/lib/errors";
import { correlationId } from "@/lib/request";
import { PrismaWorkflowRunStore } from "@/lib/orchestration/prisma-store";

export async function GET(request:Request,{params}:{params:Promise<{runId:string}>}){
 const cid=correlationId(request);
 try{
  const session=await requireApiSession("financial.read");
  const {runId}=await params;
  const run=await new PrismaWorkflowRunStore().load(runId);
  if(!run) throw new AppError("RESOURCE_NOT_FOUND","Workflow run not found.",404);
  if(run.context.organizationId!==session.organization.id) throw new AppError("TENANT_BOUNDARY_VIOLATION","Workflow belongs to another organization.",403);
  return Response.json({run});
 }catch(error){return errorResponse(error,cid);}
}
