export type FiscalRange = { code: string; startDate: Date; endDate: Date };

export function assertValidFiscalPeriods(year: FiscalRange, periods: FiscalRange[]) {
  const ordered = [...periods].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  for (let index = 0; index < ordered.length; index++) {
    const period = ordered[index];
    if (period.startDate > period.endDate || period.startDate < year.startDate || period.endDate > year.endDate) throw new Error(`Invalid fiscal period: ${period.code}`);
    if (index > 0 && ordered[index - 1].endDate >= period.startDate) throw new Error(`Overlapping fiscal period: ${period.code}`);
  }
}
