"use client";
import { useState } from "react";

async function postJson(url:string,body:object){
 const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 const data=await response.json();
 if(!response.ok) throw new Error(data?.message??data?.error??"Request failed");
 return data;
}

export function StartCloseWorkflow({legalEntityId,fiscalPeriodId}:{legalEntityId:string;fiscalPeriodId:string}){
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState<string>();
 return <div><button className="button" disabled={busy} onClick={async()=>{setBusy(true);try{const data=await postJson("/api/orchestration/start",{legalEntityId,fiscalPeriodId});setMessage("Workflow created: "+data.runId+". Open Control Center to execute and review.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to start workflow");}finally{setBusy(false);}}}>{busy?"Starting...":"Start governed close workflow"}</button>{message&&<p className="subtle" role="status">{message}</p>}</div>;
}

export function WorkflowActions({runId,status,canApprove}:{runId:string;status:string;canApprove:boolean}){
 const [message,setMessage]=useState<string>(); const [busy,setBusy]=useState(false);
 const invoke=async(kind:"approve"|"resume")=>{setBusy(true);try{const url="/api/orchestration/"+runId+"/"+kind;const body=kind==="approve"?{stepId:"controller-approval",evidenceId:"human-approval:"+crypto.randomUUID()}:{};const data=await postJson(url,body);setMessage((kind==="approve"?"Approved: ":"Executed: ")+data.status);location.reload();}catch(e){setMessage(e instanceof Error?e.message:"Action failed");setBusy(false);}};
 return <div>{status==="WAITING_APPROVAL"&&canApprove&&<button className="button" disabled={busy} onClick={()=>invoke("approve")}>Approve close</button>}{["READY","RUNNING"].includes(status)&&<button className="button button-secondary" disabled={busy} onClick={()=>invoke("resume")}>Execute next steps</button>}{message&&<p className="subtle" role="status">{message}</p>}</div>;
}
