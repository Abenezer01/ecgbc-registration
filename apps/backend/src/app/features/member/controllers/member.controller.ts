import { NextFunction, Request, Response } from "express";
import { GetMembersQueryParams } from "../interfaces/query-params.interface";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { DataLookup } from "@prisma/client";
import { CommonObjectState, MemberType } from "../../data-lookup/enums/data-lookup.enum";
import { sendSuccessResponse, sendPaginatedResponse } from "../../../shared/helpers/response.helper";
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";

// Helper to get allowed ministry fellowship IDs for current staff by email
async function getAllowedMinistryIdsByEmail(email: string): Promise<string[]> {
  const staff = await prisma.staff.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!staff) return [];

  // Use junction table to read linked fellowships; cast prisma to any to bypass outdated types
  const links = await (prisma as any).staffFellowship.findMany({
    where: { staffId: staff.id },
    select: { fellowshipId: true },
  });

  return (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
}

// Utility: read allowed fellowships from request or junction table
async function getAllowedFellowshipIdsFromReq(req: Request): Promise<string[]> {
  const reqAny = req as any;
  const pre = reqAny.rbac?.allowedFellowshipIds as string[] | undefined;
  if (pre && pre.length > 0) return pre;
  const email = reqAny.staff?.email as string | undefined;
  if (!email) return [];
  return getAllowedMinistryIdsByEmail(email);
}

async function assertAccessToMember(req: Request, memberId: string) {
  const reqAny = (req as any);
  if (reqAny.isAdminRole) return; // full access

  // Fetch member to check fellowship scope and active flag
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { councilFellowshipId: true, isActive: true },
  });
  if (!member) throw new AppError(`Member with ID ${memberId} does not exist`, 400);

  // All non-admins: must be within assigned council fellowships
  const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
  if (
    Array.isArray(allowedFellowshipIds) &&
    allowedFellowshipIds.length > 0 &&
    !allowedFellowshipIds.includes((member as any).councilFellowshipId)
  ) {
    throw new AppError("Access denied: You do not have access to this council fellowship", 403);
  }

  // Active-only users cannot view/act on inactive members
  if (reqAny?.rbac?.activeOnly && member.isActive === false) {
    throw new AppError("Access denied: Inactive records are not visible", 403);
  }
}

export const getAllInactiveMembers = catchAsync(async (req: Request, res: Response) => {
  // Admins see all; scoped users see none unless they have deactivate permission, which is handled by route guard
  const reqAny = req as any;
  const isAdmin = !!reqAny.isAdminRole;

  console.log(`getAllInactiveMembers: isAdmin=${isAdmin}, user email=${reqAny.staff?.email}`);

  const [inactiveState, deletedState] = await Promise.all([
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.IN_ACTIVE } }) as unknown as Promise<DataLookup>,
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.DELETED } }) as unknown as Promise<DataLookup>
  ]);

  console.log(`getAllInactiveMembers: inactiveState=${inactiveState?.id}, deletedState=${deletedState?.id}`);

  let where: any = {
    AND: [
      {
        OR: [
          { isActive: false },
          { stateId: inactiveState?.id }
        ]
      },
      deletedState ? { stateId: { not: deletedState.id } } : {}
    ]
  };
  console.log(`getAllInactiveMembers: where clause:`, JSON.stringify(where, null, 2));
  if (!isAdmin) {
    const allowedFellowshipIds: string[] = reqAny.rbac?.allowedFellowshipIds ?? [];
    where = {
      ...where,
      ...(allowedFellowshipIds.length > 0 ? { councilFellowshipId: { in: allowedFellowshipIds } } : { id: { in: [] } }),
    };
  }

  const members = await prisma.member.findMany({
    where,
    include: {
      type: true,
      boardMembers: { include: { title: true } },
      previousType: true,
      state: true,
      region: true,
      reports: true,
    }
  });

  console.log(`getAllInactiveMembers: found ${members.length} inactive members`);
  console.log(`getAllInactiveMembers: first few members:`, members.slice(0, 3).map(m => ({ id: m.id, name: m.name, isActive: m.isActive, stateId: m.stateId })));

  // Also check total count of inactive members
  const totalInactive = await prisma.member.count({ where: { isActive: false } });
  console.log(`getAllInactiveMembers: total inactive members in DB: ${totalInactive}`);

  const responseData = {
    status: "success",
    data: { members },
  };
  console.log(`getAllInactiveMembers: sending response with ${members.length} members`);

  sendSuccessResponse(res, { members });
});

export const getInactiveCount = catchAsync(async (req: Request, res: Response) => {
  const reqAny = req as any;
  const isAdmin = !!reqAny.isAdminRole;

  const [inactiveState, deletedState] = await Promise.all([
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.IN_ACTIVE } }) as unknown as Promise<DataLookup>,
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.DELETED } }) as unknown as Promise<DataLookup>
  ]);

  let where: any = {
    AND: [
      {
        OR: [
          { isActive: false },
          { stateId: inactiveState?.id }
        ]
      },
      deletedState ? { stateId: { not: deletedState.id } } : {}
    ]
  };
  if (!isAdmin) {
    const allowedFellowshipIds: string[] = reqAny.rbac?.allowedFellowshipIds ?? [];
    where = {
      AND: [
        where,
        ...(allowedFellowshipIds.length > 0 ? [{ councilFellowshipId: { in: allowedFellowshipIds } }] : [{ id: { in: [] } }]),
      ]
    };
  }

  const count = await prisma.member.count({ where });
  console.log(`getInactiveCount: ${count} (Admin: ${isAdmin})`);
  sendSuccessResponse(res, { count });
});

// Soft delete a member (mark as inactive)
export const softDeleteMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await assertAccessToMember(req, req.params.id);
  const { id } = req.params;
  const inactiveState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.IN_ACTIVE },
  }) as unknown as DataLookup;

  const member = await prisma.member.update({
    where: { id },
    data: {
      isActive: false,
      stateId: inactiveState.id,
      reasonForInactive: req.body.reason || "Marked inactive by admin",
    },
    include: {
      boardMembers: { include: { title: true } },
      type: true,
      previousType: true,
      state: true,
      region: true,
      reports: true,
      councilFellowship: true,
    },
  });

  // Log activity
  await logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.MEMBER,
    entityId: member.id,
    description: `Soft deleted member ${member.name}`,
    metadata: { memberId: member.id, name: member.name, reason: req.body.reason },
  }, req);

  sendSuccessResponse(res, { member });
});

// Restore a member (mark as active)
export const restoreMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await assertAccessToMember(req, req.params.id);
  const { id } = req.params;
  const activeState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.ACTIVE },
  }) as unknown as DataLookup;

  const member = await prisma.member.update({
    where: { id },
    data: {
      isActive: true,
      stateId: activeState.id,
      reasonForInactive: null,
    },
    include: {
      boardMembers: { include: { title: true } },
      type: true,
      previousType: true,
      state: true,
      region: true,
      reports: true,
      councilFellowship: true,
    },
  });

  // Log activity
  await logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.MEMBER,
    entityId: member.id,
    description: `Restored member ${member.name}`,
    metadata: { memberId: member.id, name: member.name },
  }, req);

  sendSuccessResponse(res, { member });
});

// Get inactive members (paginated)
export const getInactiveMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10 } = req.query as any;
  const reqAny = req as any;
  const isAdmin = !!reqAny.isAdminRole;

  let where: any = {
    AND: [
      {
        OR: [
          { isActive: false },
          { state: { value: CommonObjectState.IN_ACTIVE } }
        ]
      },
      {
        state: {
          value: { not: CommonObjectState.DELETED }
        }
      }
    ]
  };
  if (!isAdmin) {
    const allowedFellowshipIds: string[] = reqAny.rbac?.allowedFellowshipIds ?? [];
    where = {
      AND: [
        where,
        ...(allowedFellowshipIds.length > 0 ? [{ councilFellowshipId: { in: allowedFellowshipIds } }] : [{ id: { in: [] } }]),
      ]
    };
  }

  const members = await prisma.member.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      type: true,
      boardMembers: { include: { title: true } },
      previousType: true,
      state: true,
      region: true,
      reports: true,
    }
  });

  const total = await prisma.member.count({
    where,
  });

  sendPaginatedResponse(res, { members }, { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
});

// Main getMembers
export const getMembers = catchAsync(
  async (
    req: Request, 
    res: Response,
    next: NextFunction
  ) => {
    const query = req.query as unknown as GetMembersQueryParams;
    const page = Number(query._page) || 1;
    const limit = Number(query._limit) || 5;
    const skip = (page - 1) * limit;

    const reqAny = req as any;
    const userEmail = (reqAny.staff?.email ?? reqAny.user?.email) as string | undefined;
    if (!userEmail) {
      return next(new AppError("User email not found in request", 401));
    }

    // Prefer RBAC precomputed fellowship scope if present
    const allowedFellowshipIds = reqAny.rbac?.allowedFellowshipIds?.length
      ? reqAny.rbac.allowedFellowshipIds
      : [] // await getAllowedMinistryIdsByEmail(userEmail);

    const filters = {
      ...(req as any).filters,
    } as any;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: filters,
        include: {
          boardMembers: { include: { title: true } },
          type: true,
          previousType: true,
          state: true,
          region: true,
          reports: {
            include: {
              status: true
            }
          },
          councilFellowship: true,
        },
        take: limit,
        skip,
      }),
      prisma.member.count({
        where: filters,
      }),
    ]);

    sendPaginatedResponse(res, { members }, { page, limit, total });
  }
);

// Get single member
export const getMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await assertAccessToMember(req, req.params.id);
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        boardMembers: { include: { title: true } },
        type: true,
        previousType: true,
        state: true,
        region: true,
        reports: true,
        councilFellowship: true,
        contactPerson: true,
      },
    });

    if (!member) {
      return next(
        new AppError(`Member with ID ${req.params.id} does not exist`, 400)
      );
    }

    sendSuccessResponse(res, { member });
  }
);

// Create member
export const createMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reqAny = req as any;
    let {
      name,
      nameEn,
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
      councilFellowshipId,
      typeId,
      stateId,
      boardMembers,
      memberFiles,
      memberCategoryId,
      contactPersonFullName,
      contactPersonPhoneNumber,
      contactPersonEmail,
    } = req.body;

    // Non-admins can only create inside their assigned fellowships
    if (!reqAny.isAdminRole) {
      const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
      if (
        Array.isArray(allowedFellowshipIds) &&
        allowedFellowshipIds.length > 0 &&
        (!councilFellowshipId || !allowedFellowshipIds.includes(councilFellowshipId))
      ) {
        return next(new AppError("Access denied: You cannot create outside your council fellowships", 403));
      }
    }

    boardMembers = JSON.parse(boardMembers);

    if (!stateId) {
      const state = (await prisma.dataLookup.findFirst({
        where: { value: CommonObjectState.ACTIVE },
      })) as unknown as DataLookup;
      stateId = state.id;
    }

    const member = await prisma.member.create({
      data: {
        name,
        ...(nameEn ? { nameEn } : {}),
        councilFellowshipId,
        certificateNo,
        certificateIssuedDate: new Date(certificateIssuedDate),
        isInEthiopia: isInEthiopia == 'true',
        country,
        ...(regionId && { regionId }),
        city,
        subcity: subcity || "",
        zone: zone || "",
        district: district || "",
        houseNumber: houseNumber || "",
        poBoxNumber: poBoxNumber || "",
        email: email || "",
        phoneNumber: phoneNumber || "",
        typeId,
        stateId,
        ...(memberCategoryId ? { memberCategoryId } : {}),
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
      include: {
        boardMembers: { include: { title: true } },
        type: true,
        previousType: true,
        state: true,
        region: true,
        reports: true,
      },
    });

    for (const file of memberFiles) {
      await prisma.file.create({
        data: {
          memberId: member.id,
          fileName: file.fileName,
          file: file?.file || "",
          ...(file.categoryId ? { categoryId: file.categoryId } : {}),
        },
        include: { member: true, councilFellowship: true },
      });
    }


    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
    await logActivity({
      action: ActivityAction.CREATE,
      entity: ActivityEntity.MEMBER,
      entityId: member.id,
      description: `Created member ${name} with certificate ${certificateNo}`,
      metadata: { name, certificateNo, councilFellowshipId, typeId },
    }, req);

    // Auto-create initial REGISTERED action state
    const staffId = (req as any).staff?.id as string | undefined;
    if (staffId) {
      await (prisma as any).actionState.create({
        data: {
          entityType: "MEMBER",
          entityId: member.id,
          state: "REGISTERED",
          note: "Member registered",
          performedBy: staffId,
        },
      });
    }

    sendSuccessResponse(res, { member });
  }
);

// Update member
export const updateMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await assertAccessToMember(req, req.params.id);
    const {
      name,
      nameEn,
      certificateNo,
      certificateIssuedDate,
      isInEthiopia,
      councilFellowshipId,
      memberCategoryId,
      regionId,
      stateId,
      phoneNumber,
      email,
      typeId,
      boardMembers,
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
    const memberId = req.params.id;
    let currentMember = await prisma.member.findUnique({
      where: { id: memberId },
      include: { contactPerson: true },
    });
    if (!currentMember) {
      return next(
        new AppError(`Member with ID ${memberId} does not exist`, 400)
      );
    }

    // RBAC: prevent moving to out-of-scope fellowship for non-admins
    const reqAny = req as any;
    if (!reqAny.isAdminRole && councilFellowshipId) {
      const allowedFellowshipIds = await getAllowedFellowshipIdsFromReq(req);
      if (
        Array.isArray(allowedFellowshipIds) &&
        allowedFellowshipIds.length > 0 &&
        !allowedFellowshipIds.includes(councilFellowshipId)
      ) {
        return next(new AppError("Access denied: You cannot move member to an out-of-scope fellowship", 403));
      }
    }

    let updatedData: any = { isInEthiopia: Boolean(isInEthiopia) };
    if (typeId && typeId !== currentMember.typeId) {
      updatedData.previousTypeId = currentMember.typeId;
      updatedData.typeChangedAt = new Date();
      updatedData.typeId = typeId;
    } else if (typeId) {
      updatedData.typeId = typeId;
    }
    if (regionId) updatedData.regionId = regionId;
    if (stateId) updatedData.stateId = stateId;
    if (name) updatedData.name = name;
    if (nameEn !== undefined) updatedData.nameEn = nameEn;
    updatedData.email = email;
    updatedData.phoneNumber = phoneNumber;
    updatedData.city = city;
    updatedData.subcity = subcity;
    updatedData.zone = zone;
    updatedData.district = district;
    updatedData.houseNumber = houseNumber;
    updatedData.poBoxNumber = poBoxNumber;
    if (certificateNo) updatedData.certificateNo = certificateNo;
    if (certificateIssuedDate)
      updatedData.certificateIssuedDate = new Date(certificateIssuedDate);
    if (councilFellowshipId)
      updatedData.councilFellowshipId = councilFellowshipId;
    if (memberCategoryId) updatedData.memberCategoryId = memberCategoryId;

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
    } else if (currentMember.contactPerson) {
      // If cleared from the UI
      updatedData.contactPerson = {
        delete: true,
      };
    }

    if (boardMembers) {
      // 1. Get existing board member IDs for the member
      const existingIds = await prisma.boardMember.findMany({
        where: { memberId: req.params.id },
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

      // 3. Upsert (update or create) the remaining ones
      console.log('boardMembers update debug', { 
        incomingCount: boardMembers.length, 
        existingCount: existingIds.length,
        toDeleteCount: toDelete.length,
        toDeleteIds: toDelete 
      });

      await Promise.all(
        boardMembers.map(
          async (boardMember: {
            id: string;
            fullName: string;
            fullNameEn?: string;
            phoneNumber: string;
            titleId?: string;
          }) => {
            await prisma.boardMember.upsert({
              where: { id: boardMember.id },
              update: {
                fullName: boardMember.fullName,
                ...(boardMember.fullNameEn ? { fullNameEn: boardMember.fullNameEn } : {}),
                phoneNumber: boardMember.phoneNumber,
                ...(boardMember.titleId ? { titleId: boardMember.titleId } : {}),
              },
              create: {
                councilFellowshipId: currentMember.councilFellowshipId,
                memberId: currentMember?.id,
                fullName: boardMember.fullName,
                ...(boardMember.fullNameEn ? { fullNameEn: boardMember.fullNameEn } : {}),
                phoneNumber: boardMember.phoneNumber,
                ...(boardMember.titleId ? { titleId: boardMember.titleId } : {}),
              },
            });
          }
        )
      );
    }
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: { ...updatedData },
      include: {
        boardMembers: { include: { title: true } },
        type: true,
        previousType: true,
        state: true,
        region: true,
        reports: true,
      },
    });


    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      entityId: member.id,
      description: `Updated member ${member.name}`,
      metadata: { memberId: member.id, name: member.name, certificateNo: member.certificateNo, changes: Object.keys(changes).length > 0 ? changes : undefined },
    }, req);

    sendSuccessResponse(res, { member });
  }
);

// Activate member
export const activeMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await assertAccessToMember(req, req.params.id);
    let member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {},
    });
    if (!member) {
      return next(
        new AppError(`Member with ID ${req.params.id} does not exist`, 400)
      );
    }
    const activeState = (await prisma.dataLookup.findFirst({
      where: { value: CommonObjectState.ACTIVE },
    })) as unknown as DataLookup;

    member = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        stateId: activeState.id,
        isActive: true,
        reasonForInactive: null,
      },
      include: {
        boardMembers: { include: { title: true } },
        type: true,
        previousType: true,
        state: true,
        region: true,
        reports: true,
      },
    });


    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      entityId: member.id,
      description: `Activated member ${member.name}`,
      metadata: { memberId: member.id, name: member.name },
    }, req);

    sendSuccessResponse(res, { member });
  }
);

// Inactivate member
export const inactiveMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await assertAccessToMember(req, req.params.id);
    const { reason } = req.body;
    let member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {},
    });
    if (!member) {
      return next(
        new AppError(`Member with ID ${req.params.id} does not exist`, 400)
      );
    }
    const inactiveState = (await prisma.dataLookup.findFirst({
      where: { value: CommonObjectState.IN_ACTIVE },
    })) as unknown as DataLookup;

    member = await prisma.member.update({
      where: { id: req.params.id },
      data: {
        stateId: inactiveState.id,
        isActive: false,
        reasonForInactive: reason,
      },
      include: {
        boardMembers: { include: { title: true } },
        type: true,
        previousType: true,
        state: true,
        region: true,
        reports: true,
      },
    });


    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
    await logActivity({
      action: ActivityAction.UPDATE,
      entity: ActivityEntity.MEMBER,
      entityId: member.id,
      description: `Inactivated member ${member.name}`,
      metadata: { memberId: member.id, name: member.name, reason },
    }, req);

    sendSuccessResponse(res, { member });
  }
);

export const checkCertificateNumber = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { certificateNo } = req.params;

    if (!certificateNo) {
      return next(new AppError("Certificate number is required", 400));
    }

    const existingMember = await prisma.member.findUnique({
      where: { certificateNo },
      select: { id: true, name: true },
    });

    sendSuccessResponse(res, { exists: !!existingMember, member: existingMember ? { id: existingMember.id, name: existingMember.name } : null });
  }
);

export const getDeletedCount = catchAsync(async (req: Request, res: Response) => {
  const reqAny = req as any;
  // Ensure only super admin can access this count if needed, or stick to RBAC
  if (!reqAny.isAdminRole) {
    // If you want to restrict it completely to SuperAdmin:
     // return next(new AppError("Access denied", 403));
     // If you want to allow it but return 0 or scoped count:
  }
  
  // Assuming "DELETED" state is tracked. 
  // NOTE: You need to make sure 'object_state_deleted' exists in your DataLookup
  const deletedState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.DELETED },
  });

  if (!deletedState) {
    return sendSuccessResponse(res, { count: 0 });
  }

  let where: any = {
    stateId: deletedState.id
  };

  const count = await prisma.member.count({ where });
  sendSuccessResponse(res, { count });
});

export const permanentlyDeleteMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Use assertAccessToMember or custom logic. 
  // Typically "permanent delete" (trash) might be restricted to Admins or specific permissions
  // await assertAccessToMember(req, req.params.id); 
  
  const { id } = req.params;
  const deletedState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.DELETED },
  }) as unknown as DataLookup;
  
  if (!deletedState) {
      return next(new AppError("Deleted state not configured in system", 500));
  }

  console.log('Permanently deleting member:', id);
  console.log('Target Deleted State:', deletedState.id, deletedState.value);

  const currentMember = await prisma.member.findUnique({
    where: { id },
    select: { reasonForInactive: true },
  });

  const reasonForInactive = req.body.reason || currentMember?.reasonForInactive || "Moved to trash";

  const member = await prisma.member.update({
    where: { id },
    data: {
      isActive: false, 
      stateId: deletedState.id,
      reasonForInactive,
    },
    include: {
      boardMembers: { include: { title: true } },
      type: true,
      previousType: true,
      state: true,
      region: true,
      reports: true,
      councilFellowship: true,
    },
  });
  console.log('Member updated:', member.id, member.stateId);

  // Log activity
  await logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.MEMBER,
    entityId: member.id,
    description: `Permanently deleted member ${member.name}`,
    metadata: { memberId: member.id, reasonForInactive },
  }, req);

  res.status(200).json({
    status: "success",
    data: { member },
  });
});

// Get Deleted members (paginated)
export const getDeletedMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10 } = req.query as any;
  
  const deletedState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.DELETED },
  });

  if (!deletedState) {
     return sendSuccessResponse(res, { members: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  }

  let where: any = {
    stateId: deletedState.id
  };

  const members = await prisma.member.findMany({
    where,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: {
      type: true,
      boardMembers: { include: { title: true } },
      previousType: true,
      state: true,
      region: true,
      reports: true,
    }
  });

  const total = await prisma.member.count({
    where,
  });

  sendPaginatedResponse(res, { members }, { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) });
});

export const restoreDeletedToInactive = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await assertAccessToMember(req, req.params.id);
  const { id } = req.params;
  
  const inactiveState = await prisma.dataLookup.findFirst({
    where: { value: CommonObjectState.IN_ACTIVE },
  }) as unknown as DataLookup;

  if (!inactiveState) {
    return next(new AppError("Inactive state configuration missing", 500));
  }

  const member = await prisma.member.update({
    where: { id },
    data: {
      isActive: false, // Remains false as it is inactive
      stateId: inactiveState.id, 
      reasonForInactive: "Restored from Deleted Records",
    },
    include: {
      type: true,
      state: true,
    },
  });

  // Log activity
  await logActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.MEMBER,
    entityId: member.id,
    description: `Restored deleted member ${member.name} to inactive`,
    metadata: { memberId: member.id, name: member.name },
  }, req);

  sendSuccessResponse(res, { member });
});

// Hard delete member (permanently remove from database)
export const hardDeleteMember = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    // Check if member exists
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
        return next(new AppError("Member not found", 404));
    }

    // Delete related records manually because Cascade is not enabled in schema
    await prisma.boardMember.deleteMany({ where: { memberId: id } });
    await prisma.report.deleteMany({ where: { memberId: id } });
    await prisma.file.deleteMany({ where: { memberId: id } });
    
    // Delete the member
    await prisma.member.delete({
      where: { id },
    });


    const changes: Record<string, { old: any, new: any }> = {};

    const trackChange = (field: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && oldVal !== newVal) {
        changes[field] = { old: oldVal || null, new: newVal || null };
      }
    };
    
    // Core fields
    trackChange("phoneNumber", currentMember.phoneNumber, phoneNumber);
    trackChange("regionId", currentMember.regionId, regionId);
    trackChange("stateId", currentMember.stateId, stateId);
    trackChange("city", currentMember.city, city);
    trackChange("subcity", currentMember.subcity, subcity);
    trackChange("zone", currentMember.zone, zone);
    trackChange("district", currentMember.district, district);
    trackChange("houseNumber", currentMember.houseNumber, houseNumber);
    trackChange("poBoxNumber", currentMember.poBoxNumber, poBoxNumber);
    trackChange("typeId", currentMember.typeId, typeId);
    trackChange("memberCategoryId", currentMember.memberCategoryId, memberCategoryId);
    
    if (contactPersonFullName && contactPersonPhoneNumber) {
       const cpOldName = currentMember.contactPerson?.fullName;
       const cpOldPhone = currentMember.contactPerson?.phoneNumber;
       if (cpOldName !== contactPersonFullName || cpOldPhone !== contactPersonPhoneNumber) {
           changes["contactPerson"] = {
               old: currentMember.contactPerson ? `${cpOldName} (${cpOldPhone})` : null,
               new: `${contactPersonFullName} (${contactPersonPhoneNumber})`
           };
       }
    } else if (updatedData.contactPerson?.delete) {
       changes["contactPerson"] = {
           old: currentMember.contactPerson ? `${currentMember.contactPerson.fullName} (${currentMember.contactPerson.phoneNumber})` : null,
           new: null
       };
    }

    // Log activity
    await logActivity({
      action: ActivityAction.DELETE,
      entity: ActivityEntity.MEMBER,
      entityId: id,
      description: `Hard deleted member ${member.name}`,
      metadata: { memberId: id, name: member.name },
    }, req);

    sendSuccessResponse(res, null, 204);
});

export const toggleBoardMemberStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId, boardMemberId } = req.params;

    const boardMember = await prisma.boardMember.findFirst({
      where: { id: boardMemberId, memberId },
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
