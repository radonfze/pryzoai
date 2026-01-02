
interface RateLimitContext {
  count: number;
  lastReset: number;
}

const ipMap = new Map<string, RateLimitContext>();

// Cleanup routine to prevent memory leaks (every 10 mins)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, ctx] of ipMap.entries()) {
            if (now - ctx.lastReset > 60 * 60 * 1000) { // Clear if older than 1 hour
                ipMap.delete(ip);
            }
        }
    }, 10 * 60 * 1000); 
}

/**
 * Basic In-Memory Rate Limiter
 * @param ip Client IP Address
 * @param limit Max allowed requests
 * @param windowMs Time window in milliseconds
 * @returns { success: boolean, remaining: number }
 */
export function checkRateLimit(ip: string, limit: number = 6, windowMs: number = 60 * 1000) {
  const now = Date.now();
  const ctx = ipMap.get(ip) || { count: 0, lastReset: now };

  // Reset window if expired
  if (now - ctx.lastReset > windowMs) {
    ctx.count = 0;
    ctx.lastReset = now;
  }

  // Check limit
  if (ctx.count >= limit) {
    return { success: false, remaining: 0 };
  }

  // Increment
  ctx.count++;
  ipMap.set(ip, ctx);

  return { success: true, remaining: limit - ctx.count };
}
