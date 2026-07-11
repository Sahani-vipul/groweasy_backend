import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

export const extractRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many extract requests, please try again later.' },
});

export function enforceRowLimit(req: Request, res: Response, next: NextFunction): void {
  const { rows } = req.body;
  if (Array.isArray(rows) && rows.length > 5000) {
    res.status(413).json({ message: 'Maximum 5000 rows per extract request' });
    return;
  }
  next();
}
