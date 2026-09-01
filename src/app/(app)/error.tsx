"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="panel" role="alert"><h1 className="page-heading">Workspace unavailable</h1><p className="subtle">The request could not be completed. No financial data was changed.</p><button className="button button-secondary" type="button" onClick={reset}>Try again</button></section>;
}
