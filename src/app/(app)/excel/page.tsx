import Link from "next/link";
import { FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { listTenantWorkbooks } from "@/repositories/excel-repository";

export default async function ExcelPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requirePageSession(); const query = await searchParams;
  if (!hasPermission(session.membership.role, "financial.import")) return <section className="panel" role="alert"><h1 className="page-heading">Excel unavailable</h1><p className="subtle">Your role does not permit workbook imports.</p></section>;
  const workbooks = await listTenantWorkbooks(session.organization.id);
  return <><div className="page-title-row"><div><h1 className="page-heading">Excel imports</h1><p className="subtle">Profile and map XLSX or CSV files into the canonical financial model.</p></div><span className="status">FORECAST MVP</span></div>
    {query.error && <div className="error-box" role="alert">{query.error}</div>}
    <section className="upload-panel"><div><Upload size={22} /><h2>Upload forecast file</h2><p className="subtle">XLSX or CSV · 5 MB maximum · formulas are inspected, never executed.</p></div><form action="/api/excel/workbooks" method="post" encType="multipart/form-data"><label className="file-picker">Workbook<input required type="file" name="workbook" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" /></label><button className="button button-primary" type="submit"><Upload size={17} />Upload and profile</button></form></section>
    <div className="control-note"><ShieldCheck size={17} /><span>Uploads are tenant-bound, content-checked, fingerprinted, and parsed server-side. Embedded macros are never executed.</span></div>
    <section className="import-history"><h2>Recent workbooks</h2>{workbooks.length ? <div className="workbook-list">{workbooks.map((workbook) => <Link className="workbook-row" key={workbook.id} href={`/excel/${workbook.id}`}><FileSpreadsheet size={18} /><span><strong>{workbook.originalFileName}</strong><small>{workbook.profile?.sheetCount ?? 0} sheets · {workbook.profile?.primaryShape ?? "Pending"} · {(workbook.byteSize / 1024).toFixed(1)} KB</small></span><span className={`status ${workbook.status === "IMPORTED" ? "good" : ""}`}>{workbook.status.replaceAll("_", " ")}</span></Link>)}</div> : <div className="empty-state"><FileSpreadsheet size={24} /><h2>No workbooks yet</h2><p className="subtle">Upload the first workbook to begin profiling and mapping.</p></div>}</section>
  </>;
}
