import { NextFunction, Request, Response } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { CommonObjectState } from "../../data-lookup/enums/data-lookup.enum";
import { DataLookup } from "@prisma/client";
import { GetStaffsQueryParams } from "../interfaces/query-param.interface";
import {
  DESTINANTIONS,
  FILTERS,
  multerConfig,
  RESOURCES,
} from "../../../config/multer.config";
import bcrypt from "bcryptjs";
import { sendSuccessResponse, sendPaginatedResponse } from "../../../shared/helpers/response.helper";
const upload = multerConfig(
  RESOURCES.AVATAR,
  DESTINANTIONS.IMAGE.AVATAR,
  FILTERS.IMAGE
);

/**
 * Upload Middleware
 */
export const uploadImage = {
  pre: upload.single("avatar"),
  post: (req: Request, _: Response, next: NextFunction) => {
    console.log("req.file");
    console.log(req.file);

    if (req.file) {
      req.body.avatar = req.file.filename;
    }

    next();
  },
};

export const getStaffs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetStaffsQueryParams;
    const page = query._page || 1;
    const limit = query._limit || 5;
    const skip = (page - 1) * limit;

    const [staffs, total] = await Promise.all([
      prisma.staff.findMany({
        where: {},
        include: { role: true, state: true },
        take: limit,
        skip,
      }),
      prisma.staff.count({
        where: {},
      }),
    ]);
    sendPaginatedResponse(res, { staffs }, { page, limit, total });
  }
);

export const getStaff = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const staff = await prisma.staff.findUnique({
      where: {
        id: req.params.id,
      },
      include: { role: true, state: true },
    });

    if (!staff) {
      return next(
        new AppError(`Staff with ID ${req.params.id} does not exist`, 400)
      );
    }

    sendSuccessResponse(res, { staff });
  }
);

export const createStaff = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      avatar,
      roleId,
      stateId,
    } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    let state: DataLookup;

    if (stateId) {
      state = (await prisma.dataLookup.findUnique({
        where: { id: stateId },
      })) as unknown as DataLookup;
    } else {
      state = (await prisma.dataLookup.findUnique({
        where: { value: CommonObjectState.ACTIVE },
      })) as unknown as DataLookup;
    }

    const staff = await prisma.staff.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: email,
        phoneNumber: phoneNumber ? phoneNumber : "",
        password: hashedPassword,
        avatar: avatar ? avatar : "",
        roleId: roleId,
        stateId: state.id,
      },
      include: { role: true, state: true },
    });

    sendSuccessResponse(res, { staff });
  }
);

export const updateStaff = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      avatar,
      roleId,
      stateId,
    } = req.body;

    let updatedData: any = {};
    if (firstName) updatedData.firstName = firstName;
    if (lastName) updatedData.lastName = lastName;
    if (email) updatedData.email = email;
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (avatar) updatedData.avatar = avatar;
    if (password) updatedData.password = await bcrypt.hash(password, 10);
    if (stateId) updatedData.stateId = stateId;
    if (roleId) updatedData.roleId = roleId;
    // console.log(`updatedData `, updatedData);

    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data: updatedData,
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
      return next(
        new AppError(`Staff with ID ${req.params.id} does not exist`, 400)
      );
    }
    sendSuccessResponse(res, { staff });
  }
);

export const getStaffStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const staffId = req.params.id;

  // Total members created by staff (from Activity)
  const totalMembersRegistered = await prisma.activity.count({
    where: { performedBy: staffId, action: 'CREATE', entity: 'MEMBER' },
  });

  // Total reports processed by staff (from ActionState)
  const totalReportsProcessed = await prisma.activity.count({
    where: { performedBy: staffId, action: { in: ['CREATE', 'UPDATE'] }, entity: 'REPORT' },
  });

  // Name Reservations requested by staff
  const totalNamesRequested = await prisma.nameReservation.count({
    where: { requestedBy: staffId },
  });

  // Name Reservations reviewed by staff
  const totalNamesReviewed = await prisma.nameReservation.count({
    where: { reviewedBy: staffId },
  });

  sendSuccessResponse(res, { 
    totalMembersRegistered,
    totalReportsProcessed,
    totalNamesRequested,
    totalNamesReviewed
  });
});

export const getStaffLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const staffId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const logs = await prisma.activity.findMany({
    where: { performedBy: staffId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.activity.count({
    where: { performedBy: staffId },
  });

  sendSuccessResponse(res, { 
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getStaffFellowships = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { role: true, state: true },
    });
    if (!staff) return next(new AppError(`Staff not found`, 404));

    const staffFellowships = await prisma.staffFellowship.findMany({
      where: { staffId: req.params.id },
      include: { fellowship: true },
    });

    sendSuccessResponse(res, {
      staff,
      fellowships: staffFellowships.map((sf) => sf.fellowship),
    });
  }
);

export const assignStaffFellowships = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fellowshipIds } = req.body as { fellowshipIds: string[] };
    const staffId = req.params.id;

    if (!Array.isArray(fellowshipIds)) {
      return next(new AppError("fellowshipIds must be an array", 400));
    }

    const created = await Promise.all(
      fellowshipIds.map((fellowshipId) =>
        prisma.staffFellowship.upsert({
          where: { staffId_fellowshipId: { staffId, fellowshipId } },
          update: {},
          create: { staffId, fellowshipId },
        })
      )
    );

    sendSuccessResponse(res, { assigned: created.length });
  }
);

export const updateStaffFellowships = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fellowshipIds } = req.body as { fellowshipIds: string[] };
    const staffId = req.params.id;

    if (!Array.isArray(fellowshipIds)) {
      return next(new AppError("fellowshipIds must be an array", 400));
    }

    await prisma.staffFellowship.deleteMany({ where: { staffId } });

    const created = await Promise.all(
      fellowshipIds.map((fellowshipId) =>
        prisma.staffFellowship.create({ data: { staffId, fellowshipId } })
      )
    );

    sendSuccessResponse(res, { assigned: created.length });
  }
);

export const removeStaffFellowship = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: staffId, fellowshipId } = req.params;

    await prisma.staffFellowship.deleteMany({
      where: { staffId, fellowshipId },
    });

    sendSuccessResponse(res, { removed: true });
  }
);
