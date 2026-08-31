import Link from "next/link";

export default function NotFound() {
  return <main className="content"><section className="panel"><h1 className="page-heading">Page not found</h1><p className="subtle">The requested Planora resource does not exist or is not available to you.</p><Link className="button button-primary" href="/">Return to Planora</Link></section></main>;
}
