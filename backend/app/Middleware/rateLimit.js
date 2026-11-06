export function createRateLimiter({ windowMs, max, message, keyGenerator }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  function middleware(request, response, next) {
    const key = keyGenerator ? keyGenerator(request) : request.ip || request.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      response.setHeader("Retry-After", String(retryAfter));
      return response.status(429).json({ message: message || "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau." });
    }

    next();
  }

  return middleware;
}
