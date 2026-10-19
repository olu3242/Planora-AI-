"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type InputRow = { id: string; date: string; amountMinor: number; currency: string; description: string; reference?: string };
export function BookkeepingCleanupProposalForm() {
 const router = useRouter();
 const [batchId, setBatchId] = useState("");
 const [raw, setRaw] = useState("[]");
 const [key, setKey] = useState("");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [result, setResult] = useState("");
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return;
  setError(""); setResult("");
  let transactions: InputRow[];
  try {
   const parsed: unknown = JSON.parse(raw);
   if (!Array.isArray(parsed) || parsed.length > 10000) throw new Error("Expected an array of up to 10,000 transactions.");
   transactions = parsed as InputRow[];
  } catch { setError("Enter a valid JSON array of transactions (maximum 10,000)."); return; }
  const requestKey = key || crypto.randomUUID();
  if (!key) setKey(requestKey);
  setBusy(true);
  try {
   const response = await fetch("/api/accounting/bookkeeping-cleanup", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ batchId, idempotencyKey: requestKey, transactions }),
   });
   const body: unknown = await response.json();
   if (!response.ok) { setError("Proposal was not accepted. Check the input or contact an administrator."); return; }
   const execution = body as { executionId?: string; duplicate?: boolean };
   setResult(execution.duplicate ? "Existing proposal returned." : "Proposal submitted.");
   if (execution.executionId) router.refresh();
  } catch { setError("Network error. Retry with the same request key to prevent duplicates."); }
  finally { setBusy(false); }
 }
 return <form onSubmit={submit} className="panel">
  <h2>Submit cleanup proposal</h2>
  <p className="subtle">JSON transaction array. This creates findings only; it does not change your ledger. Completed runs appear in the review queue for authorized reviewers.</p>
  <label>Batch identifier <input required maxLength={256} value={batchId} onChange={e => setBatchId(e.target.value)} /></label>
  <label>Transactions (JSON) <textarea required rows={8} spellCheck={false} value={raw} onChange={e => setRaw(e.target.value)} /></label>
  <button type="submit" disabled={busy || !batchId.trim() || !raw.trim()}>{busy ? "Submitting..." : "Analyze transactions"}</button>
  <button type="button" disabled={busy} onClick={() => { setKey(""); setResult(""); setError(""); setBatchId(""); setRaw("[]"); }}>Start new request</button>
  {error && <p role="alert">{error}</p>}{result && <p role="status">{result}</p>}
 </form>;
}
