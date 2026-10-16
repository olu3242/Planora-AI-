export function canPreviewBankReconciliation(role: string, active: boolean): boolean {
  return active && (role === 'CFO' || role === 'FPA_DIRECTOR');
}
