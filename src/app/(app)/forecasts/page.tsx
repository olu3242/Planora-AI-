import Link from "next/link";
import { FileChartColumn } from "lucide-react";
import { requirePageSession } from "@/auth/session";
import { hasPermission } from "@/permissions/permissions";
import { latestTenantForecastVersion } from "@/repositories/forecast-repository";

export default async function ForecastsPage() {
  const session = await requirePageSession();
  if (!hasPermission(session.membership.role, "financial.read")) return <section className="panel" role="alert"><h1>403 — Forecasts unavailable</h1><p>Platform operations does not grant tenant financial access.</p></section>;
  const version = await latestTenantForecastVersion(session.organization.id);
  return <><h1 className="page-heading">Forecast cycles</h1><p className="subtle">Controlled forecast review from imported source data through final approval.</p>{version ? <Link className="cycle-row" href={`/forecasts/${version.id}`}><FileChartColumn size={20}/><span><strong>{version.forecast.name}</strong><small>Version {version.version} · {version.lines.length} financial lines</small></span><span className={`status ${["APPROVED","LOCKED"].includes(version.status) ? "good" : ""}`}>{version.status.replaceAll("_"," ")}</span></Link> : <div className="empty-state"><FileChartColumn size={24}/><h2>No forecast cycle</h2><p className="subtle">Import a valid forecast file to create the first draft.</p></div>}</>;
}
