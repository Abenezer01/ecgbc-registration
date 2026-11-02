import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { hashApiKey } from "../../external-api/middlewares/api-key.middleware";

function generateSecureApiKey(env = "live"): { plainKey: string; keyPrefix: string; keyHash: string } {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const plainKey = `ecgbc_${env}_${randomBytes}`;
  const keyPrefix = `ecgbc_${env}_${randomBytes.substring(0, 8)}...`;
  const keyHash = hashApiKey(plainKey);
  return { plainKey, keyPrefix, keyHash };
}

export const createApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, scopes, rateLimit, allowedIps, expiresAt } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return next(new AppError("API Key 'name' is required (e.g. 'Youth Mobile App').", 400));
    }

    const normalizedScopes = Array.isArray(scopes) && scopes.length > 0 
      ? scopes 
      : ["members:read", "members:verify"];

    const { plainKey, keyPrefix, keyHash } = generateSecureApiKey();

    const staffId = (req as any).staff?.id || null;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        keyPrefix,
        keyHash,
        scopes: normalizedScopes,
        rateLimit: Number(rateLimit) > 0 ? Number(rateLimit) : 60,
        allowedIps: allowedIps?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: staffId,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "API Key created successfully. Copy the secret key now; it will not be displayed again.",
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          description: apiKey.description,
          keyPrefix: apiKey.keyPrefix,
          scopes: apiKey.scopes,
          rateLimit: apiKey.rateLimit,
          allowedIps: apiKey.allowedIps,
          isActive: apiKey.isActive,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
          creator: apiKey.creator,
        },
        plainKey, // Expose ONLY ONCE upon creation
      },
    });
  }
);

export const listApiKeys = catchAsync(async (req: Request, res: Response) => {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  return res.status(200).json({
    status: "success",
    data: keys.map((k) => ({
      id: k.id,
      name: k.name,
      description: k.description,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      isActive: k.isActive,
      rateLimit: k.rateLimit,
      allowedIps: k.allowedIps,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
      creator: k.creator,
    })),
  });
});

export const updateApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, scopes, rateLimit, allowedIps, isActive, expiresAt } = req.body;

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`API Key with ID '${id}' not found.`, 404));
    }

    const data: any = {};
    if (typeof name === "string") data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (Array.isArray(scopes)) data.scopes = scopes;
    if (rateLimit !== undefined) data.rateLimit = Number(rateLimit);
    if (allowedIps !== undefined) data.allowedIps = allowedIps?.trim() || null;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await prisma.apiKey.update({
      where: { id },
      data,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "API Key updated successfully.",
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        keyPrefix: updated.keyPrefix,
        scopes: updated.scopes,
        isActive: updated.isActive,
        rateLimit: updated.rateLimit,
        allowedIps: updated.allowedIps,
        lastUsedAt: updated.lastUsedAt,
        expiresAt: updated.expiresAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        creator: updated.creator,
      },
    });
  }
);

export const regenerateApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`API Key with ID '${id}' not found.`, 404));
    }

    const { plainKey, keyPrefix, keyHash } = generateSecureApiKey();

    const updated = await prisma.apiKey.update({
      where: { id },
      data: {
        keyPrefix,
        keyHash,
        lastUsedAt: null,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "API Key regenerated successfully. Copy the new secret key now.",
      data: {
        id: updated.id,
        name: updated.name,
        keyPrefix: updated.keyPrefix,
        plainKey,
      },
    });
  }
);

export const deleteApiKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError(`API Key with ID '${id}' not found.`, 404));
    }

    await prisma.apiKey.delete({ where: { id } });

    return res.status(200).json({
      status: "success",
      message: "API Key deleted/revoked permanently.",
    });
  }
);
