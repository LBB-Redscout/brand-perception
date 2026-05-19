export async function withRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, waitSeconds: number) => void
): Promise<T> {
  const delays = [20000, 40000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes('429') || err.message.toLowerCase().includes('rate limit'));

      if (!isRateLimit || attempt === 2) throw err;

      const waitMs = delays[attempt];
      const waitSec = waitMs / 1000;
      onRetry?.(attempt + 1, waitSec);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}
