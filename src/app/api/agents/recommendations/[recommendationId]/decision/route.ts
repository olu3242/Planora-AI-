import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { decideAgentRecommendation } from "@/application/agents/decision-context";
import { correlationId } from "@/lib/request";

const schema=z.object({decision:z.enum(["ACCEPTED","EDITED","REJECTED"]),reason:z.string().trim().min(1).max(500),finalContent:z.string().trim().max(4000).optional()});
export async function POST(request:Request,{params}:{params:Promise<{recommendationId:string}>}){
 const cid=correlationId(request);
 try{
  const session=await requireApiSession("mapping.approve");
  const body=schema.parse(await request.json());const {recommendationId}=await params;
  const recommendation=await decideAgentRecommendation({organizationId:session.organization.id,actorId:session.user.id,recommendationId,...body});
  return Response.json({recommendationId:recommendation.id,status:recommendation.status,correlationId:cid});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"DECISION_FAILED",correlationId:cid},{status:error instanceof z.ZodError?400:403});}
}
