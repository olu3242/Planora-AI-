"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CleanupDecisionForm({ executionId, transactionId, kind }: {
  executionId: string; transactionId: string; kind: "DUPLICATE_CANDIDATE" | "INVALID_INPUT";
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(decision: "ACCEPT_FINDING" | "REJECT_FINDING") {
    if (!reason.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/accounting/bookkeeping-cleanup/review", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ executionId, transactionId, kind, decision, reason }),
      });
      if (!response.ok) { setError("Review could not be saved. Refresh and try again."); return; }
      setReason(""); router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }
  return <div>
    <label>Review reason <textarea aria-label={`Reason for ${transactionId}`} value={reason}
      maxLength={2000} onChange={event => setReason(event.target.value)} required /></label>
    <div><button type="button" disabled={busy || !reason.trim()} onClick={() => submit("ACCEPT_FINDING")}>Accept finding</button>
      <button type="button" disabled={busy || !reason.trim()} onClick={() => submit("REJECT_FINDING")}>Reject finding</button></div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
