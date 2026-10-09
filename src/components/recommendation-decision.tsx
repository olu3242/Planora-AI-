"use client";
import { useState } from "react";
export function RecommendationDecision({id}:{id:string}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function decide(decision:"ACCEPTED"|"REJECTED"){const reason=window.prompt("Decision reason");if(!reason)return;setBusy(true);const r=await fetch("/api/agents/recommendations/"+id+"/decision",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({decision,reason})});const d=await r.json();setMessage(r.ok?decision:d.error??"Decision failed");setBusy(false);if(r.ok)location.reload();}
 return <div><button className="button button-secondary" disabled={busy} onClick={()=>decide("ACCEPTED")}>Accept to memory</button> <button className="button button-secondary" disabled={busy} onClick={()=>decide("REJECTED")}>Reject</button>{message&&<span role="status"> {message}</span>}</div>;
}
