import { requirePageSession } from "@/auth/session";
import { prisma } from "@/lib/prisma";

export default async function CommandCenter() {
  const session = await requirePageSession();
  const auditCount = await prisma.auditEvent.count({ where: { organizationId: session.organization.id } });
  return <><h1 className="page-heading">Command Center</h1><p className="subtle">Foundation status for {session.organization.name}. Financial modules become available as their certification gates pass.</p><section className="metrics" aria-label="Foundation status"><div className="metric"><div className="metric-label">Session</div><div className="metric-value">Active</div></div><div className="metric"><div className="metric-label">Tenant</div><div className="metric-value">Bound</div></div><div className="metric"><div className="metric-label">Role</div><div className="metric-value">{session.membership.role.replace("FPA_", "FP&A ")}</div></div><div className="metric"><div className="metric-label">Audit events</div><div className="metric-value">{auditCount}</div></div></section><section className="panel"><span className="status good">PHASE 1</span><h2>Secure workspace ready</h2><p className="subtle">Authentication, organization context, permission evaluation, tenant-scoped access, and append-only audit are active. Excel and financial workflows remain unavailable until their implementation gates pass.</p></section></>;
}
