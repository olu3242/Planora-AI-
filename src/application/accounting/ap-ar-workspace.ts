import "server-only";
import { prisma } from "@/lib/prisma";
export async function getApArWorkspace(organizationId:string,legalEntityId?:string){
 const [bills,invoices]=await Promise.all([
  prisma.apBill.findMany({where:{organizationId,...(legalEntityId?{legalEntityId}:{}),status:{not:"VOID"}},orderBy:{dueDate:"asc"},take:100,include:{vendor:{select:{code:true,name:true}},allocations:{select:{amountMinor:true}}}}),
  prisma.arInvoice.findMany({where:{organizationId,...(legalEntityId?{legalEntityId}:{}),status:{not:"VOID"}},orderBy:{dueDate:"asc"},take:100,include:{customer:{select:{code:true,name:true}},allocations:{select:{amountMinor:true}}}})
 ]);
 return {bills:bills.map(x=>({...x,outstandingMinor:x.totalMinor-x.allocations.reduce((n,a)=>n+a.amountMinor,0n)})),invoices:invoices.map(x=>({...x,outstandingMinor:x.totalMinor-x.allocations.reduce((n,a)=>n+a.amountMinor,0n)}))};
}