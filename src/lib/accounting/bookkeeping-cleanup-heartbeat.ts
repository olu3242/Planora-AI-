/** Lease heartbeat lifecycle for trusted long-running advisory scans. */
export async function withCleanupLeaseHeartbeat<T>(
  renew: () => Promise<unknown>,
  work: () => Promise<T>,
  intervalMs = 20000,
): Promise<T> {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000 || intervalMs > 30000) {
    throw new Error("INVALID_CLEANUP_HEARTBEAT_INTERVAL");
  }
  let failure: unknown;
  let busy = false;
  const timer = setInterval(() => {
    if (busy || failure !== undefined) return;
    busy = true;
    void renew().catch(error => { failure = error; }).finally(() => { busy = false; });
  }, intervalMs);
  timer.unref?.();
  try {
    // Renew before starting to avoid beginning work on an expired lease.
    await renew();
    const result = await work();
    if (failure !== undefined) throw failure;
    await renew();
    return result;
  } finally {
    clearInterval(timer);
  }
}
