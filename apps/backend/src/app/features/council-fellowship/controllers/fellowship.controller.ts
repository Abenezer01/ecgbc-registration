import { NextFunction, Request, Response } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { sendSuccessResponse, sendSuccessResponseWithMessage } from "../../../shared/helpers/response.helper";

// Helper to get allowed fellowship IDs for the current staff
async function getAllowedFellowshipIds(email: string): Promise<string[]> {
  // Cast prisma to any to bypass mismatched generated types and fetch via junction relation
  const staff = await (prisma as any).staff.findUnique({
    where: { email },
    include: { fellowships: { select: { fellowshipId: true } } },
  });
  if (!staff || !staff.fellowships) return [];
  return (staff.fellowships as Array<{ fellowshipId: string }>).map((f) => f.fellowshipId);
}

export const getFellowship = catchAsync(
  async (req: Request & { user?: { email: string } }, res: Response, next: NextFunction) => {
    const isAdmin = Boolean((req as any).isAdminRole);
    const scopeIds = (req as any).rbac?.allowedFellowshipIds as string[] | undefined;
    const allowedFellowshipIds = scopeIds ?? (req.user?.email ? await getAllowedFellowshipIds(req.user.email) : []);

    if (!isAdmin) {
      // Must have access to the requested id
      if (!allowedFellowshipIds.length || !allowedFellowshipIds.includes(req.params.id)) {
        return next(new AppError(`Fellowship with ID ${req.params.id} does not exist or you do not have access`, 403));
      }
    }

    const fellowship = await prisma.councilFellowship.findUnique({
      where: { id: req.params.id },
      include: { boardMembers: { include: { title: true } }, files: true, region: true, contactPerson: true },
    });

    if (!fellowship) {
      return next(
        new AppError(`Fellowship with ID ${req.params.id} does not exist or you do not have access`, 403)
      );
    }

    const normalizedFellowship = {
      ...fellowship,
      isActive: Buffer.isBuffer((fellowship as any).isActive)
        ? (fellowship as any).isActive[0] === 1
        : ((fellowship as any).isActive === 1 || (fellowship as any).isActive === true || (fellowship as any).isActive === "1"),
    };

    sendSuccessResponse(res, { fellowship: normalizedFellowship });
  }
);

export const createFellowship = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Only admins can create fellowships to avoid out-of-scope creations for scoped users
    if (!(req as any).isAdminRole) {
      return next(new AppError("Access denied: Only admins can create fellowships", 403));
    }

    let {
      name,
      country,
      regionId,
      city,
      subcity,
      zone,
      district,
      houseNumber,
      poBoxNumber,
      email,
      phoneNumber,
      certificateNo,
      certificateIssuedDate,
      isInEthiopia,
      boardMembers,
      contactPersonFullName,
      contactPersonPhoneNumber,
      contactPersonEmail,
    } = req.body;

    const fellowship = await prisma.councilFellowship.create({
      data: {
        name,
        certificateNo,
        certificateIssuedDate: new Date(certificateIssuedDate),
        isInEthiopia,
        country,
        regionId,
        city,
        subcity: subcity || "",
        zone: zone || "",
        district: district || "",
        houseNumber: houseNumber || "",
        poBoxNumber: poBoxNumber || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
        boardMembers: {
          create: boardMembers,
        },
        ...(contactPersonFullName && contactPersonPhoneNumber ? {
          contactPerson: {
            create: {
              fullName: contactPersonFullName,
              phoneNumber: contactPersonPhoneNumber,
              email: contactPersonEmail || null,
            }
          }
        } : {}),
      },
      include: { boardMembers: true, contactPerson: true },
    });

    const staffId = (req as any).staff?.id as string | undefined;
    if (staffId) {
      await (prisma as any).actionState.create({
        data: {
          entityType: "FELLOWSHIP",
          entityId: fellowship.id,
          state: "REGISTERED",
          note: "Fellowship registered",
          performedBy: staffId,
        },
      });
    }

    sendSuccessResponse(res, { fellowship });
  }
);

export const updateFellowship = catchAsync(
  async (req: Request & { user?: { email: string } }, res: Response, next: NextFunction) => {
    let {
      name,
      email,
      phoneNumber,
      certificateNo,
      certificateIssuedDate,
      isInEthiopia,
      boardMembers,
      regionId,
      region,
      country,
      city,
      subcity,
      zone,
      district,
      houseNumber,
      poBoxNumber,
      contactPersonFullName,
      contactPersonPhoneNumber,
      contactPersonEmail,
    } = req.body;

    // Prefer precomputed RBAC scope; fallback to StaffFellowship junction
    const precomputed = (req as any).rbac?.allowedFellowshipIds as string[] | undefined;
    const allowedFellowshipIds = precomputed ?? (req.user?.email ? await getAllowedFellowshipIds(req.user.email) : []);

    const isAdmin = Boolean((req as any).isAdminRole);

    if (!isAdmin) {
      // Must have access to the requested id
      if (!allowedFellowshipIds.length || !allowedFellowshipIds.includes(req.params.id)) {
        return next(new AppError(`Fellowship with ID ${req.params.id} does not exist or you do not have access`, 403));
      }
    }

    let updatedData: any = { isInEthiopia: Boolean(isInEthiopia) };
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (certificateNo) updatedData.certificateNo = certificateNo;
    if (certificateIssuedDate)
      updatedData.certificateIssuedDate = new Date(certificateIssuedDate);
    
    // Handle regionId from either regionId or region field
    if (regionId) updatedData.regionId = regionId;
    else if (region) updatedData.regionId = region;

    if (country) updatedData.country = country;
    if (city) updatedData.city = city;
    if (subcity) updatedData.subcity = subcity;
    if (zone) updatedData.zone = zone;
    if (district) updatedData.district = district;
    if (houseNumber) updatedData.houseNumber = houseNumber;
    if (poBoxNumber) updatedData.poBoxNumber = poBoxNumber;

    // Handle contactPerson upsert/delete
    const currentFellowship = await prisma.councilFellowship.findUnique({
      where: { id: req.params.id },
      include: { contactPerson: true },
    });
    if (contactPersonFullName && contactPersonPhoneNumber) {
      updatedData.contactPerson = {
        upsert: {
          create: {
            fullName: contactPersonFullName,
            phoneNumber: contactPersonPhoneNumber,
            email: contactPersonEmail || null,
          },
          update: {
            fullName: contactPersonFullName,
            phoneNumber: contactPersonPhoneNumber,
            email: contactPersonEmail || null,
          },
        },
      };
    } else if (currentFellowship?.contactPerson) {
      updatedData.contactPerson = { delete: true };
    }

    if (boardMembers) {
      // 1. Get existing board member IDs for the fellowship
      const existingIds = await prisma.boardMember.findMany({
        where: { councilFellowshipId: req.params.id },
        select: { id: true },
      });
      const incomingIds = boardMembers.map((bm: { id: string }) => bm.id);

      // 2. Identify and delete board members not present in the new list
      const toDelete = existingIds
        .filter((existing) => !incomingIds.includes(existing.id))
        .map((e) => e.id);

      if (toDelete.length > 0) {
        await prisma.boardMember.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      // 3. Upsert (update or create) the others
      await Promise.all(
        boardMembers.map(
          async (boardMember: {
            id: string;
            fullName: string;
            phoneNumber: string;
          }) => {
            await prisma.boardMember.upsert({
              where: { id: boardMember.id },
              update: {
                fullName: boardMember.fullName,
                phoneNumber: boardMember.phoneNumber,
              },
              create: {
                councilFellowshipId: req.params.id,
                fullName: boardMember.fullName,
                phoneNumber: boardMember.phoneNumber,
              },
            });
          }
        )
      );
    }

    const fellowship = await prisma.councilFellowship.update({
      where: { id: req.params.id },
      data: { ...updatedData },
      include: { boardMembers: { include: { title: true } }, contactPerson: true },
    });

    // Process new files if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      await Promise.all(
        files.map(async (file) => {
          await prisma.file.create({
            data: {
              fileName: file.originalname,
              file: `files/file/${file.filename}`, 
              councilFellowshipId: fellowship.id,
            },
          });
        })
      );
      
      // Re-fetch to include new files
      const reFetched = await prisma.councilFellowship.findUnique({
          where: { id: fellowship.id },
          include: { boardMembers: true, files: true }
      });
      return sendSuccessResponse(res, { fellowship: reFetched });
    }

    sendSuccessResponse(res, { fellowship });
  }
);

export const toggleFellowshipBoardMemberStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fellowshipId, boardMemberId } = req.params;

    const boardMember = await prisma.boardMember.findFirst({
      where: { id: boardMemberId, councilFellowshipId: fellowshipId },
    });

    if (!boardMember) {
      return next(new AppError(`Board member not found`, 404));
    }

    const updated = await prisma.boardMember.update({
      where: { id: boardMemberId },
      data: { isActive: !(boardMember as any).isActive },
      include: { title: true },
    });

    sendSuccessResponse(res, { boardMember: updated });
  }
);