import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { 
  sendSuccessResponse, 
  sendPaginatedResponse,
  sendSuccessResponseWithMessage 
} from "../../../shared/helpers/response.helper";

/**
 * Get all church users with pagination and filtering
 */
export const getChurchUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const memberId = req.query.memberId as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const [churchUsers, total] = await Promise.all([
      prisma.churchUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          memberId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          member: {
            select: {
              id: true,
              name: true,
              certificateNo: true,
            },
          },
        },
      }),
      prisma.churchUser.count({ where }),
    ]);

    sendPaginatedResponse(res, { churchUsers }, {
      page,
      limit,
      total,
    });
  }
);

/**
 * Get single church user by ID
 */
export const getChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        memberId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            certificateIssuedDate: true,
            councilFellowshipId: true,
          },
        },
      },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    sendSuccessResponse(res, churchUser);
  }
);

/**
 * Get church users by member ID
 */
export const getChurchUsersByMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;

    const [churchUsers, total] = await Promise.all([
      prisma.churchUser.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          memberId: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.churchUser.count({ where: { memberId } }),
    ]);

    sendPaginatedResponse(res, { churchUsers }, {
      page,
      limit,
      total,
    });
  }
);

/**
 * Create new church user
 */
export const createChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone, role, memberId } = req.body;

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new AppError("Member not found", 404);
    }

    // Check if email already exists
    const existingUser = await prisma.churchUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 400);
    }

    // Generate random password
    const generatedPassword = crypto.randomBytes(12).toString("hex");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const churchUser = await prisma.churchUser.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase(),
        phone: phone?.trim() || null,
        role: role || "VIEWER",
        password: hashedPassword,
        memberId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        memberId: true,
        createdAt: true,
        member: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
          },
        },
      },
    });

    // TODO: Send welcome email with credentials
    // For now, include password in response for testing
    sendSuccessResponseWithMessage(
      res,
      {
        ...churchUser,
        temporaryPassword: generatedPassword,
      },
      "Church user created successfully"
    );
  }
);

/**
 * Update church user
 */
export const updateChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { firstName, lastName, email, phone, role } = req.body;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== churchUser.email) {
      const existingUser = await prisma.churchUser.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new AppError("Email already registered", 400);
      }
    }

    const updatedUser = await prisma.churchUser.update({
      where: { id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(role && { role }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        memberId: true,
        lastLoginAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
          },
        },
      },
    });

    sendSuccessResponseWithMessage(res, updatedUser, "Church user updated successfully");
  }
);

/**
 * Delete church user (soft delete by deactivating)
 */
export const deleteChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    await prisma.churchUser.update({
      where: { id },
      data: { isActive: false },
    });

    sendSuccessResponseWithMessage(res, {}, "Church user deactivated successfully");
  }
);

/**
 * Reset user password (admin function)
 */
export const resetUserPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.churchUser.update({
      where: { id },
      data: { 
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // TODO: Send email with new password
    sendSuccessResponseWithMessage(res, {}, "Password reset successfully");
  }
);

/**
 * Toggle user status (activate/deactivate)
 */
export const toggleUserStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    const updatedUser = await prisma.churchUser.update({
      where: { id },
      data: { isActive: !churchUser.isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    sendSuccessResponseWithMessage(
      res,
      updatedUser,
      `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`
    );
  }
);
