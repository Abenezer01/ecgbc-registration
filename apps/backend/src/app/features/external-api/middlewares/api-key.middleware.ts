import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import prisma from "../../../config/db.config";
import AppError from "../../../shared/errors/app.error";
import { catchAsync } from "../../../config/error.config";

export interface AuthenticatedApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  allowedIps: string | null;
  expiresAt: Date | null;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key.trim()).digest("hex");
}

export const verifyApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let key: string | null = null;

    // Check X-API-Key header first
    const apiKeyHeader = req.headers["x-api-key"];
    if (typeof apiKeyHeader === "string") {
      key = apiKeyHeader.trim();
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      // Also accept Authorization: Bearer <apiKey>
      key = req.headers.authorization.split(" ")[1]?.trim() || null;
    }

    if (!key) {
      return next(
        new AppError(
          "API key required. Please provide your API key in the 'X-API-Key' header or 'Authorization: Bearer <key>' header.",
          401
        )
      );
    }

    const hashedKey = hashApiKey(key);

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: hashedKey },
    });

    if (!apiKey) {
      return next(new AppError("Invalid API key provided.", 401));
    }

    if (!apiKey.isActive) {
      return next(
        new AppError(
          "API key has been deactivated or revoked. Please contact ECGBC administration.",
          403
        )
      );
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return next(
        new AppError(
          "API key has expired. Please request a new API key from ECGBC administration.",
          403
        )
      );
    }

    // IP Whitelist verification (if configured on the API key)
    if (apiKey.allowedIps && apiKey.allowedIps.trim().length > 0) {
      const allowed = apiKey.allowedIps
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean);
      const clientIp = (
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        ""
      ).replace(/^.*:/, ""); // Normalize IPv6 mapped IPv4

      if (allowed.length > 0 && !allowed.includes(clientIp)) {
        return next(
          new AppError(
            `Access denied from IP address ${clientIp}. This API key is IP-restricted.`,
            403
          )
        );
      }
    }

    // Normalize scopes
    let scopes: string[] = [];
    if (Array.isArray(apiKey.scopes)) {
      scopes = apiKey.scopes as string[];
    } else if (typeof apiKey.scopes === "string") {
      try {
        scopes = JSON.parse(apiKey.scopes);
      } catch {
        scopes = [apiKey.scopes];
      }
    }

    // Attach to request
    const reqAny = req as any;
    reqAny.apiKey = {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes,
      rateLimit: apiKey.rateLimit,
      allowedIps: apiKey.allowedIps,
      expiresAt: apiKey.expiresAt,
    };

    // Asynchronously update lastUsedAt without blocking the request
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => {
        // Non-fatal, log quietly
        console.error("Failed to update apiKey.lastUsedAt:", err?.message || err);
      });

    return next();
  }
);

/**
 * Middleware factory to enforce required scopes on specific routes
 */
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqAny = req as any;
    const scopes: string[] = reqAny.apiKey?.scopes || [];

    // 'admin' or '*' scope bypasses specific scope check
    if (scopes.includes("*") || scopes.includes("admin") || scopes.includes(requiredScope)) {
      return next();
    }

    return next(
      new AppError(
        `Insufficient permissions. This endpoint requires the '${requiredScope}' scope.`,
        403
      )
    );
  };
}
