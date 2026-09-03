import { NextFunction, Request, Response } from "express";
import { GetFilesQueryParams } from "../interfaces/query-params.interface";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { DataLookup } from "@prisma/client";
import {
  DESTINANTIONS,
  FILTERS,
  multerConfig,
  RESOURCES,
} from "../../../config/multer.config";
import { toEthiopianShortDate } from "../../../shared/helpers/ethiopian-date.helper";
import { sendSuccessResponse, sendSuccessResponseWithMessage, sendPaginatedResponse } from "../../../shared/helpers/response.helper";
import path from "path";
import fs from "fs";

const upload = multerConfig(
  RESOURCES.FILE,
  DESTINANTIONS.FILE.FILE,
  FILTERS.FILE
);
const uploadWithUploadedFilename = multerConfig(
  RESOURCES.FILE,
  DESTINANTIONS.FILE.FILE,
  FILTERS.FILE,
  true
);

// RBAC helpers: rely on allowedFellowshipIds
async function getAllowedFellowshipIdsByEmail(email: string): Promise<string[]> {
  const staff = await prisma.staff.findUnique({ where: { email }, select: { id: true } });
  if (!staff) return [];
  const links = await (prisma as any).staffFellowship.findMany({
    where: { staffId: staff.id },
    select: { fellowshipId: true },
  });
  return (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
}
async function getAllowedFellowshipIdsFromReq(req: Request): Promise<string[]> {
  const reqAny = req as any;
  const pre = reqAny.rbac?.allowedFellowshipIds as string[] | undefined;
  if (pre && pre.length > 0) return pre;
  const email = reqAny.user?.email as string | undefined;
  if (!email) return [];
  return getAllowedFellowshipIdsByEmail(email);
}
async function assertAccessToMemberId(req: Request, memberId: string) {
  const reqAny = req as any;
  if (reqAny.isAdminRole) return;
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { councilFellowshipId: true },
  });
  if (!member) throw new AppError(`Member with ID ${memberId} does not exist`, 400);
  const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
  const fellowshipId = (member as any).councilFellowshipId as string | undefined;
  if (
    Array.isArray(allowedFellowshipIds) &&
    allowedFellowshipIds.length > 0 &&
    fellowshipId &&
    !allowedFellowshipIds.includes(fellowshipId)
  ) {
    throw new AppError("Access denied for this fellowship", 403);
  }
}
async function assertAccessToFellowshipId(req: Request, fellowshipId: string) {
  const reqAny = req as any;
  if (reqAny.isAdminRole) return;
  const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
  if (
    Array.isArray(allowedFellowshipIds) &&
    allowedFellowshipIds.length > 0 &&
    !allowedFellowshipIds.includes(fellowshipId)
  ) {
    throw new AppError("Access denied for this fellowship", 403);
  }
}

/**
 * Upload Middleware
 */
export const uploadFile = {
  pre: upload.single("file"),
  post: (req: Request, _: Response, next: NextFunction) => {
    console.log("req.file");
    console.log(req.file);

    if (req.file) {
      req.body.file = req.file.filename;
    }

    next();
  },
};
export const uploadMemberFiles = {
  pre: uploadWithUploadedFilename.array("memberFiles", 5), // Allows up to 5 files with field name 'memberFiles'
  post: (req: Request, res: Response, next: NextFunction) => {
    if (req.files && Array.isArray(req.files)) {
      let categoryIds: string[] = [];
      try {
        categoryIds = JSON.parse(req.body.fileCategoryIds || "[]");
      } catch (_) {}
      req.body.memberFiles = req.files.map((file, idx) => ({
        fileName: file.originalname,
        file: file.filename,
        ...(categoryIds[idx] ? { categoryId: categoryIds[idx] } : {}),
      }));
    }
    next();
  },
};
export const uploadFellowshipFiles = {
  pre: uploadWithUploadedFilename.array("fellowshipFiles", 5), 
  post: (req: Request, res: Response, next: NextFunction) => {
    if (req.files && Array.isArray(req.files)) {
      req.body.fellowshipFiles = req.files.map((file) => ({
        fileName: file.originalname,
        file: file.filename,
      })); 
    }
    next();
  },
};
export const getFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetFilesQueryParams;
    const page = Number(query._page) || 1;
    const limit = Number(query._limit) || 5;
    const skip = (page - 1) * limit;

    const whereFilters = { ...(req as any).filters };
    console.log('Applied filters in controller:', whereFilters);

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: whereFilters,
        include: { member: true, councilFellowship: true, category: true },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.file.count({
        where: whereFilters,
        take: limit,
        skip,
      }),
    ]);
    console.log('Found files:', files.length, 'total:', total);
    sendPaginatedResponse(res, { files }, { page, limit, total });
  }
);

export const getExpiringFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const days = Number(req.query.days) || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const whereFilters: any = {
      expiryDate: {
        lte: futureDate,
      },
    };

    // RBAC
    const reqAny = req as any;
    if (!reqAny.isAdminRole) {
      const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
      if (Array.isArray(allowedFellowshipIds) && allowedFellowshipIds.length > 0) {
        whereFilters.OR = [
          { councilFellowshipId: { in: allowedFellowshipIds } },
          { member: { councilFellowshipId: { in: allowedFellowshipIds } } }
        ];
      } else {
        whereFilters.id = { in: [] };
      }
    }

    const files = await prisma.file.findMany({
      where: whereFilters,
      include: {
        member: true,
        councilFellowship: true,
        category: true,
      },
      orderBy: {
        expiryDate: 'asc',
      }
    });

    sendSuccessResponse(res, { files });
  }
);

export const getFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const file = await prisma.file.findUnique({
      where: {
        id: req.params.id,
      },
      include: { member: true, councilFellowship: true },
    });

    if (!file) {
      return next(
        new AppError(`File with ID ${req.params.id} does not exist`, 400)
      );
    }

    // RBAC: ensure access to referenced entity
    if (file.memberId) {
      await assertAccessToMemberId(req, file.memberId);
    } else if (file.councilFellowshipId) {
      await assertAccessToFellowshipId(req, file.councilFellowshipId);
    }

    sendSuccessResponse(res, { file });
  }
);

export const createMemberFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    let { member, file, fileName, expiryDate } = req.body;

    // RBAC: ensure staff can access the member
    await assertAccessToMemberId(req, member);

    const newFile = await prisma.file.create({
      data: {
        memberId: member,
        fileName: fileName,
        file: file ? file : "",
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
      },
      include: { member: true, councilFellowship: true },
    });

    sendSuccessResponse(res, { file: newFile });
  }
);
export const bulkUploadMemberFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('req.body');
    console.log(req.body);

    let { member, memberFiles ,isFromSelamMinster} = req.body;

    // RBAC: ensure staff can access the member
    await assertAccessToMemberId(req, member);

    const memberExists = await prisma.member.findUnique({ where: { id: member } });
    if (!memberExists) {
      return next(new AppError(`Member with ID ${member} not found`, 404));
    }

    const createdFileRecords: any[] = [];

    for (const file of memberFiles) {
   const newFileRecord =   await prisma.file.create({
        data: {
          memberId: member,
          fileName: file.fileName,
          file: file ? file.file : "",
          isFromSelamMinster:isFromSelamMinster ==='true'?true:false
        },
        include: { member: true, councilFellowship: true },
      });
      createdFileRecords.push(newFileRecord);
    }

    sendSuccessResponseWithMessage(res, { files: createdFileRecords }, `${memberFiles.length} files uploaded successfully.`, 201);
  }
);
export const bulkUploadFellowshipFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { fellowship, fellowshipFiles } = req.body;
    
    console.log("bulkUploadFellowshipFiles body:", req.body);

    if (!fellowship) {
        return next(new AppError("Fellowship ID is required", 400));
    }

    // Check if fellowshipFiles exists
    if (!fellowshipFiles || !Array.isArray(fellowshipFiles)) {
       return next(new AppError("No valid files provided", 400));
    }

    await assertAccessToFellowshipId(req, fellowship);

    const fellowshipExists = await prisma.councilFellowship.findUnique({ where: { id: fellowship } });
    if (!fellowshipExists) {
      return next(new AppError(`Fellowship with ID ${fellowship} not found`, 404));
    }

    const createdFileRecords: any[] = [];

    for (const file of fellowshipFiles) {
      const newFileRecord = await prisma.file.create({
        data: {
          councilFellowshipId: fellowship,
          fileName: file.fileName,
          file: file.file,
        },
        include: { member: true, councilFellowship: true },
      });
      createdFileRecords.push(newFileRecord);
    }

    sendSuccessResponseWithMessage(res, { files: createdFileRecords }, `${fellowshipFiles.length} files uploaded successfully.`, 201);
  }
);
export const createFellowshipFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    let { file, fileName, fellowship, expiryDate } = req.body;

    // RBAC: ensure staff can access the fellowship
    await assertAccessToFellowshipId(req, fellowship);

    const newFile = await prisma.file.create({
      data: {
        councilFellowshipId: fellowship ?? undefined,
        fileName: fileName ?? file ?? "uploaded",
        file: file ? file : "",
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
      },
      include: { member: true, councilFellowship: true },
    });

    sendSuccessResponse(res, { file: newFile });
  }
);

export const updateFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const existing = await prisma.file.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(new AppError(`File with ID ${req.params.id} does not exist`, 400));
    }

    // RBAC
    if (existing.memberId) {
      await assertAccessToMemberId(req, existing.memberId);
    } else if (existing.councilFellowshipId) {
      await assertAccessToFellowshipId(req, existing.councilFellowshipId);
    }

    const { fileName, categoryId, expiryDate } = req.body;

    // If a new file was uploaded, delete the old one from disk first
    if (req.body.file && existing.file) {
      const oldPath = path.join(__dirname, "../../" + DESTINANTIONS.FILE.FILE, existing.file);
      try {
        if (fs.existsSync(oldPath)) await fs.promises.unlink(oldPath);
      } catch (e) {
        console.error("Failed to delete old file during update:", e);
      }
    }

    const updated = await prisma.file.update({
      where: { id: req.params.id },
      data: {
        ...(fileName    !== undefined ? { fileName }                  : {}),
        ...(categoryId  !== undefined ? { categoryId: categoryId || null } : {}),
        ...(expiryDate  !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
        ...(req.body.file             ? { file: req.body.file }       : {}),
      },
      include: {
        member: true,
        councilFellowship: true,
        category: true,
      },
    });

    sendSuccessResponse(res, { file: updated });
  }
);

export const deleteFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    if (!file) {
      return next(
        new AppError(`File with ID ${req.params.id} does not exist`, 400)
      );
    }

    // RBAC: ensure access to referenced entity before deletion
    if (file.memberId) {
      await assertAccessToMemberId(req, file.memberId);
    } else if (file.councilFellowshipId) {
      await assertAccessToFellowshipId(req, file.councilFellowshipId);
    }

    // Get the file path
    const filePath = file.file ? path.join(
      __dirname,
      "../../" + DESTINANTIONS.FILE.FILE,
      file.file
    ) : "";
    console.log("destination", DESTINANTIONS.FILE.FILE);
    console.log("filePath", filePath);

    // Check if file exists on the disk
    try {
      if (filePath && fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
  console.error(`Failed to delete file: ${filePath}`, error);
  // Don't throw - continue with database cleanup
}

    // // Delete the file record from the database
    await prisma.file.delete({
      where: { id: req.params.id },
    });

    sendSuccessResponse(res, { file });
  }
);
