import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../../config/db.config";
import AppError from "../../../shared/errors/app.error";

/**
 * Interface for church user request with additional user information
 */
export interface ChurchUserRequest extends Request {
  churchUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    memberId: string;
  };
}

/**
 * Verify JWT token for church user authentication
 */
export const verifyChurchUser = async (
  req: ChurchUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_ACCESS_SECRET_KEY || "your-secret-key";

    const decoded = jwt.verify(token, jwtSecret) as {
      churchUserId: string;
      email: string;
    };

    const churchUser = await prisma.churchUser.findUnique({
      where: { id: decoded.churchUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        memberId: true,
        isActive: true,
      },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 401);
    }

    if (!churchUser.isActive) {
      throw new AppError("Church user account is inactive", 403);
    }

    req.churchUser = churchUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Invalid token", 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token expired", 401));
    } else {
      next(error);
    }
  }
};

/**
 * Check if church user has required role
 */
export const checkChurchRole = (allowedRoles: string[]) => {
  return (req: ChurchUserRequest, res: Response, next: NextFunction): void => {
    if (!req.churchUser) {
      next(new AppError("Not authenticated", 401));
      return;
    }

    if (!allowedRoles.includes(req.churchUser.role)) {
      next(new AppError("Insufficient permissions", 403));
      return;
    }

    next();
  };
};

/**
 * Check if church user can access specific member data
 */
export const checkMemberAccess = async (
  req: ChurchUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.churchUser) {
      next(new AppError("Not authenticated", 401));
      return;
    }

    const { memberId } = req.params;

    if (memberId && memberId !== req.churchUser.memberId) {
      next(new AppError("Access denied to this member's data", 403));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
