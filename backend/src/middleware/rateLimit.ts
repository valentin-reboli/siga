import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/httpError';


interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function rateLimit({ windowMs, max, message }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  // Limpieza periódica para no acumular IPs viejas.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);
  // No bloquear el cierre del proceso por este timer.
  if (typeof cleanup.unref === 'function') cleanup.unref();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return next(
        HttpError.tooManyRequests(
          message ?? 'Demasiados intentos. Probá de nuevo en unos minutos.',
        ),
      );
    }
    next();
  };
}
