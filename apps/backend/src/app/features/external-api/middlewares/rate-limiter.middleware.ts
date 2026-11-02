import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding/fixed window rate limit storage
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function createExternalRateLimiter() {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqAny = req as any;
    const apiKey = reqAny.apiKey;

    // Use API key ID if authenticated, else IP
    const clientId = apiKey?.id || req.ip || req.socket.remoteAddress || "anonymous";
    const limit = apiKey?.rateLimit || 60; // default 60 requests per window
    const windowMs = 60 * 1000; // 1 minute window

    const now = Date.now();
    let record = rateLimitMap.get(clientId);

    if (!record || record.resetAt <= now) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitMap.set(clientId, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, limit - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", resetSeconds.toString());

    if (record.count > limit) {
      res.setHeader("Retry-After", resetSeconds.toString());
      return res.status(429).json({
        status: "error",
        message: "Too many requests. Rate limit exceeded for this API key.",
        retryAfterSeconds: resetSeconds,
      });
    }

    return next();
  };
}
