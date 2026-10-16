export type CleanupLeaseCheck = () => Promise<void>;
export async function runWithCleanupFence<T>(check: CleanupLeaseCheck, operation: () => Promise<T>): Promise<T> {
  await check();
  const result = await operation();
  await check();
  return result;
}
