export type Variance = Readonly<{
  actualMinor: bigint;
  forecastMinor: bigint;
  deltaMinor: bigint;
  absoluteDeltaMinor: bigint;
  direction: "ABOVE" | "BELOW" | "ON_TARGET";
}>;
/** A deterministic comparison; favorable/unfavorable requires account semantics. */
export function calculateActualForecastVariance(actualMinor: bigint, forecastMinor: bigint): Variance {
  const deltaMinor = actualMinor - forecastMinor;
  return { actualMinor, forecastMinor, deltaMinor,
    absoluteDeltaMinor: deltaMinor < 0n ? -deltaMinor : deltaMinor,
    direction: deltaMinor > 0n ? "ABOVE" : deltaMinor < 0n ? "BELOW" : "ON_TARGET" };
}
