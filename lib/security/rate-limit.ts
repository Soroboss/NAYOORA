type RateLimitEntry = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & { __nayooraRateLimits?: Map<string, RateLimitEntry> };
const store = globalStore.__nayooraRateLimits ?? new Map<string, RateLimitEntry>();
globalStore.__nayooraRateLimits = store;

export function rateLimit(identifier: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const current = store.get(identifier);
  if (!current || current.resetAt <= now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
