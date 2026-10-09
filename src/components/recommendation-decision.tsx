"use client";
import { useState } from "react";
export function RecommendationDecision({id}:{id:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function submit(decision:"ACCEPTED"|"EDITED"|"REJECTED"){
  const reason=window.prompt("Decision reason");if(!reason)return;
  const finalContent=decision==="EDITED"?window.prompt("Enter the corrected recommendation content"):undefined;if(decision==="EDITED"&&!finalContent)return;
  setBusy(true);try{const r=await fetch("/api/agents/recommendations/"+id+"/decision",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({decision,reason,finalContent})});const d=await r.json();setMessage(r.ok?decision:d.error??"Decision failed");if(r.ok)location.reload();}finally{setBusy(false);}
 }
 return <div><button className="button button-secondary" disabled={busy} onClick={()=>submit("ACCEPTED")}>Accept to memory</button> <button className="button button-secondary" disabled={busy} onClick={()=>submit("EDITED")}>Edit &amp; accept</button> <button className="button button-secondary" disabled={busy} onClick={()=>submit("REJECTED")}>Reject</button>{message&&<span role="status"> {message}</span>}</div>;
}
