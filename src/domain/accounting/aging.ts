export type OpenItem = Readonly<{
  id: string;
  dueDate: string;
  outstandingMinor: bigint;
}>;
export type AgingBuckets = Readonly<{
  current: bigint;
  days1to30: bigint;
  days31to60: bigint;
  days61to90: bigint;
  over90: bigint;
}>;
/** Invoice and bill aging; date inputs must be ISO YYYY-MM-DD. */
export function calculateAging(items: readonly OpenItem[], asOf: string): AgingBuckets {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const parse = (value: string): number => {
    if (!iso.test(value)) throw new Error("INVALID_DATE");
    const date = new Date(value + "T00:00:00.000Z");
    if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
    return date.valueOf();
  };
  const today = parse(asOf);
  const result = { current: 0n, days1to30: 0n, days31to60: 0n, days61to90: 0n, over90: 0n };
  for (const item of items) {
    if (item.outstandingMinor < 0n) throw new Error("NEGATIVE_OUTSTANDING");
    const days = Math.floor((today - parse(item.dueDate)) / 86400000);
    const bucket = days <= 0 ? "current" : days <= 30 ? "days1to30" :
      days <= 60 ? "days31to60" : days <= 90 ? "days61to90" : "over90";
    result[bucket] += item.outstandingMinor;
  }
  return result;
}
