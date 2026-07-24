import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { sendSuccessResponse, sendSuccessResponseWithMessage } from "../../../shared/helpers/response.helper";
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";

/**
 * Login church user
 */
export const loginChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const churchUser = await prisma.churchUser.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            councilFellowshipId: true,
          },
        },
      },
    });

    if (!churchUser) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!churchUser.isActive) {
      throw new AppError("Your account is inactive. Please contact administrator.", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, churchUser.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Update last login timestamp
    await prisma.churchUser.update({
      where: { id: churchUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

    const token = jwt.sign(
      {
        churchUserId: churchUser.id,
        email: churchUser.email,
      },
      jwtSecret,
      {
        expiresIn: jwtExpiresIn as jwt.SignOptions["expiresIn"],
      }
    );

    // Log activity
    await logActivity({
      action: ActivityAction.LOGIN,
      entity: ActivityEntity.CHURCH_USER,
      entityId: churchUser.id,
      description: `Church user ${churchUser.email} logged in`,
      metadata: { email: churchUser.email, memberId: churchUser.memberId },
    }, req);

    sendSuccessResponseWithMessage(res, {
      accessToken: token,
      user: {
        id: churchUser.id,
        firstName: churchUser.firstName,
        lastName: churchUser.lastName,
        email: churchUser.email,
        phone: churchUser.phone,
        role: churchUser.role,
        memberId: churchUser.memberId,
      },
      church: churchUser.member,
    }, "Login successful");
  }
);

/**
 * Get authenticated church user information
 */
export const getAuthenticatedChurchUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    
    const churchUser = await prisma.churchUser.findUnique({
      where: { id: churchUserReq.churchUser.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        memberId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
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
 * Reset password (send reset token)
 */
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const churchUser = await prisma.churchUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!churchUser) {
      // Don't reveal if email exists for security
      sendSuccessResponseWithMessage(res, {}, "If the email exists, a password reset link has been sent");
      return;
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.churchUser.update({
      where: { id: churchUser.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.PASSWORD_RESET,
      entity: ActivityEntity.CHURCH_USER,
      entityId: churchUser.id,
      description: `Password reset requested for church user ${churchUser.email}`,
      metadata: { email: churchUser.email },
    }, req);

    // TODO: Send email with reset link
    // For now, return the token for testing purposes
    sendSuccessResponseWithMessage(res, { 
      resetToken,
      resetExpires 
    }, "Password reset token generated");
  }
);

/**
 * Change password for authenticated user
 */
export const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const churchUserReq = req as any;
    const { currentPassword, newPassword } = req.body;

    const churchUser = await prisma.churchUser.findUnique({
      where: { id: churchUserReq.churchUser.id },
    });

    if (!churchUser) {
      throw new AppError("Church user not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, churchUser.password);

    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.churchUser.update({
      where: { id: churchUser.id },
      data: { password: hashedPassword },
    });

    // Log activity
    await logActivity({
      action: ActivityAction.PASSWORD_CHANGE,
      entity: ActivityEntity.CHURCH_USER,
      entityId: churchUser.id,
      description: `Church user ${churchUser.email} changed password`,
      metadata: { email: churchUser.email },
    }, req);

    sendSuccessResponseWithMessage(res, {}, "Password changed successfully");
  }
);
