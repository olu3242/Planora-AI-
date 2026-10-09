import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { decideAgentRecommendation } from "@/application/agents/decision-context";
import { recommendationReviewPermission } from "@/application/agents/recommendation-permission";
import { prisma } from "@/lib/prisma";
import { correlationId } from "@/lib/request";

const schema=z.object({decision:z.enum(["ACCEPTED","EDITED","REJECTED"]),reason:z.string().trim().min(1).max(500),finalContent:z.string().trim().max(4000).optional()});
export async function POST(request:Request,{params}:{params:Promise<{recommendationId:string}>}){
 const cid=correlationId(request);
 try{
  const {recommendationId}=await params;
  const base=await requireApiSession();
  const recommendation=await prisma.agentRecommendation.findFirst({where:{id:recommendationId,organizationId:base.organization.id},select:{type:true}});
  if(!recommendation) throw new Error("RECOMMENDATION_NOT_FOUND");
  const session=await requireApiSession(recommendationReviewPermission(recommendation.type));
  const body=schema.parse(await request.json());
  const decided=await decideAgentRecommendation({organizationId:session.organization.id,actorId:session.user.id,recommendationId,...body});
  return Response.json({recommendationId:decided.id,status:decided.status,correlationId:cid});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"DECISION_FAILED",correlationId:cid},{status:error instanceof z.ZodError?400:403});}
}
