import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import { cleanEnv, str } from "envalid";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import prisma from "../../../config/db.config";
import {
  CommonObjectState,
  MemberType,
} from "../../data-lookup/enums/data-lookup.enum";
import { getWeekRange } from "../../../shared/helpers/week.helper";
import { MemberPermission } from "../../permission/enums/permission.enum";
import { RoleType } from "../../role/enums/role-type.enum";
import { sendSuccessResponse } from "../../../shared/helpers/response.helper";

const env = cleanEnv(process.env, {
  JWT_ACCESS_SECRET_KEY: str(),
  JWT_ACCESS_EXPIRES_IN: str(),
  JWT_REFRESH_SECRET_KEY: str(),
  JWT_REFRESH_EXPIRES_IN: str(),
});

export const getAuthenticatedStaff = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let staff = await prisma.staff.findFirst({
      where: { id: (req as any).staff?.id }, // narrow cast to accommodate Request augmentation
      include: {
        role: {
          include: {
            type: true,
            permissions: {
              select: {
                id: true,
                codeName: true,
              },
            },
          },
        },
      },
    });

    // Strip MEMBER_DEACTIVATE for Ephrem in response so UI hides deactivate/restore
    if (staff?.email?.toLowerCase() === "ephibillioner@gmail.com") {
      staff.role.permissions = staff.role.permissions.filter(
        (p: any) => p.codeName !== MemberPermission.MEMBER_DEACTIVATE
      );
    }

    // Gezu must be strictly read-only in UI and API checks
    if (staff?.email?.toLowerCase() === "gezuabiy@gmail.com") {
      staff.role.permissions = staff.role.permissions.filter((p: any) =>
        String(p.codeName || "").startsWith("view_")
      );
    }

    // Include RBAC information for frontend filtering
    const rbac = (req as any).rbac;

    sendSuccessResponse(res, { staff, rbac });
  }
);
export const loginStaff = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    let staff = await prisma.staff.findFirst({
      where: { email: email, state: { value: CommonObjectState.ACTIVE } },
      include: {
        role: {
          include: {
            type: true,
            permissions: {
              select: {
                id: true,
                codeName: true,
              },
            },
          },
        },
        state: true,
      },
    });
    if (!staff) {
      return next(new AppError(`Staff not found`, 400));
    }

    // Strip MEMBER_DEACTIVATE for Ephrem in response so UI hides deactivate/restore
    if (staff.email?.toLowerCase() === "ephibillioner@gmail.com") {
      staff.role.permissions = staff.role.permissions.filter(
        (p: any) => p.codeName !== MemberPermission.MEMBER_DEACTIVATE
      );
    }

    // Gezu must be strictly read-only in UI and API checks
    if (staff.email?.toLowerCase() === "gezuabiy@gmail.com") {
      staff.role.permissions = staff.role.permissions.filter((p: any) =>
        String(p.codeName || "").startsWith("view_")
      );
    }

    //Check Password
    const isMatch = await bcrypt.compare(password, staff.password!);
    if (!isMatch) {
      return res.status(400).json({
        errors: [{ msg: "Password not correct." }],
      });
    }

    // Build RBAC scope for frontend filtering
    let rbac: any = null;
    const isAdmin = staff.role.type?.value === RoleType.OWNER;
    if (!isAdmin) {
      rbac = {};

      // Fellowships scope via junction table
      try {
        const links = await (prisma as any).staffFellowship.findMany({
          where: { staffId: staff.id },
          select: { fellowshipId: true },
        });
        rbac.allowedFellowshipIds = (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
      } catch (_) {
        rbac.allowedFellowshipIds = [];
      }

      // Active-only if staff lacks deactivate permission
      const permissionCodes = staff.role.permissions.map((p) => p.codeName);
      rbac.activeOnly = !permissionCodes.includes(MemberPermission.MEMBER_DEACTIVATE);

      // Entity type constraints for specific scoped staff
      const email = staff.email.toLowerCase();
      if (email === "ephibillioner@gmail.com") {
        rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      }
      if (email === "abateabinet94@gmail.com") {
        rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      }
      if (email === "kiyagudina07@gmail.com") {
        rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      }
      if (email === "mehirit2067@gmail.com") {
        rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      }
      if (email === "gezuabiy@gmail.com") {
        rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      }
    }

    //Return jsonwebtoken :to login the user
    const payload = {
      staff: {
        id: staff.id,
      },
    };

    const accessToken = await promisify(jwt.sign)(
      payload,
      //@ts-ignore
      env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
    const refreshToken = await promisify(jwt.sign)(
      payload,
      //@ts-ignore
      env.JWT_REFRESH_SECRET_KEY,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      }
    );
    sendSuccessResponse(res, { staff, accessToken, refreshToken, rbac });
  }
);

export const getDashboardStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { startOfWeek, endOfWeek } = getWeekRange();

    // RBAC-aware stats: admins see all; scoped staff (e.g., gezu) see only allowed scope
    const reqAny = req as any;
    const isAdmin = !!reqAny.isAdminRole;

    if (isAdmin) {
      let [totalCouncilFellowships, weeklyCouncilFellowships] = await Promise.all([
        prisma.councilFellowship.count({
          where: {},
        }),
        prisma.councilFellowship.count({
          where: {
            createdAt: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        }),
      ]);
      let [totalChurches, weeklyChurches] = await Promise.all([
        prisma.member.count({
          where: {
            isActive: true,
            type: {
              value: MemberType.CHURCH,
            },
          },
        }),
        prisma.member.count({
          where: {
            isActive: true,
            type: {
              value: MemberType.CHURCH,
            },
            createdAt: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        }),
      ]);
      let [totalMinistries, weeklyMinistries] = await Promise.all([
        prisma.member.count({
          where: {
            isActive: true,
            type: {
              value: MemberType.MINISTRY,
            },
          },
        }),
        prisma.member.count({
          where: {
            isActive: true,
            type: {
              value: MemberType.MINISTRY,
            },
            createdAt: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        }),
      ]);
      // Total deleted (for super admin)
      let totalDeleted = 0;
      if (isAdmin) {
         // Assuming 'objecjt_state_deleted' based on previous checks
         // We should fetch the ID first to be safe, or use the value if querying by lookup value is supported by your logic directly, 
         // but typically we query by stateId or join. Let's use the lookup value relation filtering.
         totalDeleted = await prisma.member.count({
            where: {
              state: {
                 value: CommonObjectState.DELETED
              }
            }
         });
      }
      const stat = {
        totalChurches,
        weeklyChurches,
        totalMinistries,
        weeklyMinistries,
        totalCouncilFellowships,
        weeklyCouncilFellowships,
        churchesVisible: true,
        totalDeleted, // Add to response
      } as const;
      return sendSuccessResponse(res, { stat });
    }

    // Non-admin: scope by RBAC
    const allowedFellowshipIds: string[] = reqAny.rbac?.allowedFellowshipIds ?? [];
    const allowedCategoryIds: string[] | undefined = reqAny.rbac?.allowedCategoryIds;
    const allowedTypeValues: string[] | undefined = reqAny.rbac?.allowedTypeValues;

    // If no scoped fellowships, everything is zero
    if (!allowedFellowshipIds || allowedFellowshipIds.length === 0) {
      const stat = {
        totalChurches: 0,
        weeklyChurches: 0,
        totalMinistries: 0,
        weeklyMinistries: 0,
        totalCouncilFellowships: 0,
        weeklyCouncilFellowships: 0,
        churchesVisible: Array.isArray(allowedTypeValues) ? allowedTypeValues.includes(MemberType.CHURCH) : true,
      };
      return sendSuccessResponse(res, { stat });
    }

    const fellowshipIdFilter = { id: { in: allowedFellowshipIds } } as const;

    const [totalCouncilFellowships, weeklyCouncilFellowships] = await Promise.all([
      prisma.councilFellowship.count({ where: fellowshipIdFilter }),
      prisma.councilFellowship.count({
        where: {
          ...fellowshipIdFilter,
          createdAt: { gte: startOfWeek, lte: endOfWeek },
        },
      }),
    ]);

    // Ministries within allowed fellowships and categories
    const baseMinistryWhere: any = {
      isActive: true,
      type: { value: MemberType.MINISTRY },
      councilFellowshipId: { in: allowedFellowshipIds },
    };
    if (Array.isArray(allowedCategoryIds) && allowedCategoryIds.length > 0) {
      baseMinistryWhere.memberCategoryId = { in: allowedCategoryIds };
    }

    const [totalMinistries, weeklyMinistries] = await Promise.all([
      prisma.member.count({ where: baseMinistryWhere }),
      prisma.member.count({
        where: {
          ...baseMinistryWhere,
          createdAt: { gte: startOfWeek, lte: endOfWeek },
        },
      }),
    ]);

    // Churches within allowed fellowships (only when permitted by allowedTypeValues)
    const canSeeChurches = !Array.isArray(allowedTypeValues) || allowedTypeValues.includes(MemberType.CHURCH);
    let totalChurches = 0;
    let weeklyChurches = 0;
    if (canSeeChurches) {
      const baseChurchWhere: any = {
        isActive: true,
        type: { value: MemberType.CHURCH },
        councilFellowshipId: { in: allowedFellowshipIds },
      };
      [totalChurches, weeklyChurches] = await Promise.all([
        prisma.member.count({ where: baseChurchWhere }),
        prisma.member.count({
          where: {
            ...baseChurchWhere,
            createdAt: { gte: startOfWeek, lte: endOfWeek },
          },
        }),
      ]);
    }

    const stat = {
      totalChurches,
      weeklyChurches,
      totalMinistries,
      weeklyMinistries,
      totalCouncilFellowships,
      weeklyCouncilFellowships,
      churchesVisible: canSeeChurches,
    };
    sendSuccessResponse(res, { stat });
  }
);
