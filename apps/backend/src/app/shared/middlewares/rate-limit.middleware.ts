import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

/**
 * Rate limiter for sensitive authentication endpoints (Staff & Church user login)
 * Mitigates brute-force and credential stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.AUTH_RATE_LIMIT ? parseInt(process.env.AUTH_RATE_LIMIT, 10) : 15,
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` legacy headers
  validate: { xForwardedForHeader: false },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "fail",
      message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
    });
  },
});

/**
 * Rate limiter for public registration requests and name reservation checks
 * Prevents automated denial of service / registration spam.
 */
export const publicRegistrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: process.env.PUBLIC_RATE_LIMIT ? parseInt(process.env.PUBLIC_RATE_LIMIT, 10) : 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: "fail",
      message: "Too many registration requests submitted from this IP. Please try again later.",
    });
  },
});
