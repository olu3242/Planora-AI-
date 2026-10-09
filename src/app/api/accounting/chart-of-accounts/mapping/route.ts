import { withTenantApi } from "@/lib/tenant-request";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/auth/session";
import { updateCoaMapping } from "@/application/accounting/update-coa-mapping";

const schema=z.object({accountId:z.string().uuid(),statementClass:z.enum(["PROFIT_AND_LOSS","BALANCE_SHEET","STATISTICAL"]),statementSection:z.string().trim().min(1).max(100),reportingCode:z.string().trim().min(1).max(50),cashFlowClass:z.enum(["OPERATING","INVESTING","FINANCING","CASH","NOT_APPLICABLE"]),systemPurpose:z.enum(["NONE","CASH","ACCOUNTS_RECEIVABLE","ACCOUNTS_PAYABLE","RETAINED_EARNINGS","SUSPENSE"]),suspenseAllowed:z.boolean()});
async function handlePOST(request:Request){
 try{
  const session=await requireApiSession("accounting.coa.manage"); const body=schema.parse(await request.json()); const correlationId=crypto.randomUUID();
  const mapping=await updateCoaMapping(session.organization.id,session.user.id,{...body,correlationId});
  return NextResponse.json({mapping,correlationId});
 }catch(error){const message=error instanceof Error?error.message:"COA_MAPPING_FAILED";return NextResponse.json({error:message},{status:error instanceof z.ZodError?400:message.includes("permission")?403:400});}
}

export const POST = withTenantApi(handlePOST);
