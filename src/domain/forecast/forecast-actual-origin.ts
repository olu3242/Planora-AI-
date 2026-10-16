export type ForecastActualOrigin = 'POSTED_LEDGER' | 'APPROVED_ALLOCATION' | 'UNKNOWN';
export function forecastActualOrigin(metadata: unknown): ForecastActualOrigin {
 if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 'UNKNOWN';
 const origin = (metadata as Record<string, unknown>).origin;
 if (origin === 'POSTED_LEDGER' || origin === 'APPROVED_ALLOCATION') return origin;
 return 'UNKNOWN';
}
