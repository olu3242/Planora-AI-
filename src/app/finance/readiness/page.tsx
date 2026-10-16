import Link from "next/link";
import { loadReadinessForSession } from "@/lib/accounting/financial-readiness-session";
import styles from "./readiness.module.css";

export const dynamic = "force-dynamic";
const names: Record<string,string> = {
  DATA_COMPLETENESS: "Data completeness",
  BOOKKEEPING_INTEGRITY: "Bookkeeping integrity",
  RECONCILIATION: "Reconciliation",
  ACCOUNTING_CONTROLS: "Accounting controls",
  CLOSE_READINESS: "Close readiness",
  REPORTING_READINESS: "Reporting readiness",
};
export default async function ReadinessCommandCenter({ searchParams }: {
  searchParams: Promise<{ legalEntityId?: string; periodId?: string }>;
}) {
  const params = await searchParams;
  const legalEntityId = params.legalEntityId ?? "";
  const periodId = params.periodId ?? "";
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(legalEntityId) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(periodId);
  const state = valid ? await loadReadinessForSession(legalEntityId, periodId) : null;
  const a = state?.assessment;
  const dims = a?.dimensions as Record<string,{score:number|null;checks:number}> | undefined;
  const actions = a?.actions as {checkId:string;ownerRole:string;reason:string}[] | undefined;
  return <main className={styles.main}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>PLANORA / FINANCE OPERATIONS</p><h1>Financial Readiness</h1><p>Verified financial evidence, unresolved exceptions, and close eligibility in one workspace.</p></div>
      <Link href="/">Planora home</Link>
    </header>
    <form className={styles.filters} method="GET">
      <label>Legal entity UUID<input name="legalEntityId" required defaultValue={legalEntityId} placeholder="Entity ID" /></label>
      <label>Reporting period<input name="periodId" required defaultValue={periodId} placeholder="Fiscal period UUID" /></label>
      <button type="submit">View readiness</button>
    </form>
    {!valid ? <section className={styles.panel}><h2>Select an entity and period</h2><p>Readiness is always evaluated for a specific legal entity and reporting period. No sample scores are shown as actual financial results.</p></section> :
      !a ? <section className={styles.panel}><h2>Not assessed</h2><p>No persisted readiness assessment exists for this scope. An authorized accounting workflow must evaluate verified source evidence before a score can appear.</p></section> :
      <>
        <section className={styles.summary} aria-label="Readiness assessment">
          <div><p className={styles.eyebrow}>READINESS SCORE</p><strong>{a.score === null ? "Unavailable" : a.score + "%"}</strong></div>
          <div><p className={styles.eyebrow}>ASSESSMENT STATE</p><h2>{a.status.replaceAll("_", " ")}</h2><p>As of {a.assessedAt}</p><p>Policy {a.policyVersion}</p></div>
        </section>
        <section className={styles.panel}><h2>Control dimensions</h2><div className={styles.grid}>
          {Object.entries(names).map(([key,name]) => <article key={key} className={styles.dimension}>
            <h3>{name}</h3><strong>{dims?.[key]?.score === null || dims?.[key] === undefined ? "Not assessed" : dims[key].score + "%"}</strong>
            <p>{dims?.[key]?.checks ?? 0} checks</p>
          </article>)}
        </div></section>
        <section className={styles.panel}><h2>Blocking controls</h2>{a.blockers.length ? <ul>{a.blockers.map((b:string)=><li key={b}>{b}</li>)}</ul> : <p>No material blockers in this snapshot. Approval and close remain separately governed.</p>}</section>
        <section className={styles.panel}><h2>Resolution work queue</h2>{actions?.length ? <table><thead><tr><th>Check</th><th>Owner</th><th>Reason</th></tr></thead><tbody>{actions.map((action,i)=><tr key={action.checkId + i}><td>{action.checkId}</td><td>{action.ownerRole}</td><td>{action.reason}</td></tr>)}</tbody></table> : <p>No unresolved checks in this snapshot.</p>}</section>
        <p className={styles.notice}>{a.disclaimer} Snapshot created {a.createdAt}. Access role: {state?.role}.</p>
      </>}
  </main>;
}
