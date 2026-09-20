/**
 * Simple in-memory sliding-window rate limiter. Good enough for a
 * single-instance deployment; if you scale to multiple server instances,
 * swap this for a shared store (e.g. Redis / Upstash) — the call sites
 * won't need to change.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
