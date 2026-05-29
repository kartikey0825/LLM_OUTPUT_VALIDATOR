export async function measure<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const start = performance.now();
  const value = await fn();
  const latencyMs = Math.round(performance.now() - start);
  return { value, latencyMs };
}
