export function PlanoraLogo({ compact = false }: { compact?: boolean }) {
  return <span className="planora-logo"><svg width="28" height="34" viewBox="0 0 28 34" fill="none" aria-hidden="true"><path d="M15 27C10 17 16 9 27 3c-1 9 2 19-12 24Z" fill="currentColor"/><path d="M7 29C1 23 2 15 13 11c-1 7 2 14-6 18Z" fill="#58a786"/><path d="M3 33c7-4 11-11 17-21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{!compact && <span>planora</span>}</span>;
}
