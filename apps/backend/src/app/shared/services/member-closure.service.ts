import prisma from '../../config/db.config';
import AppError from '../errors/app.error';
import { CommonObjectState } from '../../features/data-lookup/enums/data-lookup.enum';
import { logActivity, ActivityAction, ActivityEntity } from './activity.service';

export interface CreateClosureRequestParams {
  memberId: string;
  closureType?: 'DISSOLUTION' | 'LOW_MEMBERSHIP' | 'FINANCIAL_HARDSHIP' | 'LEADERSHIP_VACANCY' | 'EXTERNAL_AMALGAMATION' | 'OTHER';
  reason: string;
  resolutionDate?: Date | string;
  effectiveDate?: Date | string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  recordsLocation?: string;
  resolutionDocumentUrl?: string;
  submittedByType?: 'CHURCH_USER' | 'STAFF';
  submittedById?: string;
}

export interface ClosureRequestFilters {
  status?: string;
  memberId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class MemberClosureService {
  /**
   * Submits a new voluntary closure / self-deactivation request.
   */
  static async createClosureRequest(params: CreateClosureRequestParams, req?: any) {
    const {
      memberId,
      closureType = 'DISSOLUTION',
      reason,
      resolutionDate,
      effectiveDate = new Date(),
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
      recordsLocation,
      resolutionDocumentUrl,
      submittedByType = 'STAFF',
      submittedById,
    } = params;

    if (!reason || reason.trim() === '') {
      throw new AppError('Reason for closure is required', 400);
    }

    // 1. Verify member exists and is currently active
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { councilFellowship: true },
    });

    if (!member) {
      throw new AppError('Member church not found', 404);
    }

    if (!member.isActive) {
      throw new AppError('Church is already inactive or closed', 400);
    }

    // 2. Check for an existing unresolved closure request
    const existingPending = await prisma.memberClosureRequest.findFirst({
      where: {
        memberId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new AppError('A closure request is already pending review for this church', 400);
    }

    // 3. Create closure request record
    const closureRequest = await prisma.memberClosureRequest.create({
      data: {
        memberId,
        closureType,
        reason: reason.trim(),
        resolutionDate: resolutionDate ? new Date(resolutionDate) : null,
        effectiveDate: new Date(effectiveDate),
        contactPersonName: contactPersonName?.trim() || null,
        contactPersonPhone: contactPersonPhone?.trim() || null,
        contactPersonEmail: contactPersonEmail?.trim() || null,
        recordsLocation: recordsLocation?.trim() || null,
        resolutionDocumentUrl: resolutionDocumentUrl?.trim() || null,
        status: 'PENDING',
        submittedByType,
        submittedById: submittedById || null,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            certificateNo: true,
            councilFellowship: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 4. Log activity
    if (req) {
      await logActivity(
        {
          action: ActivityAction.CREATE,
          entity: ActivityEntity.MEMBER,
          entityId: memberId,
          description: `Submitted voluntary closure request for church "${member.name}" (${closureType})`,
          metadata: {
            closureRequestId: closureRequest.id,
            closureType,
            resolutionDate,
            effectiveDate,
            submittedByType,
          },
        },
        req
      );
    }

    return closureRequest;
  }

  /**
   * Retrieves a list of closure requests with optional status, search, and pagination.
   */
  static async getClosureRequests(filters: ClosureRequestFilters = {}) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters.search) {
      where.OR = [
        { member: { name: { contains: filters.search } } },
        { member: { certificateNo: { contains: filters.search } } },
        { reason: { contains: filters.search } },
        { contactPersonName: { contains: filters.search } },
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.memberClosureRequest.count({ where }),
      prisma.memberClosureRequest.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              certificateNo: true,
              city: true,
              subcity: true,
              isActive: true,
              currentActionState: true,
              councilFellowship: { select: { id: true, name: true } },
              region: { select: { id: true, description: true, value: true } },
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves a single closure request by its ID.
   */
  static async getClosureRequestById(id: string) {
    const request = await prisma.memberClosureRequest.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            certificateNo: true,
            city: true,
            subcity: true,
            zone: true,
            district: true,
            houseNumber: true,
            isActive: true,
            currentActionState: true,
            councilFellowship: { select: { id: true, name: true } },
            region: { select: { id: true, description: true, value: true } },
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError('Closure request not found', 404);
    }

    return request;
  }

  /**
   * Retrieves all closure requests for a specific church.
   */
  static async getMemberClosureRequests(memberId: string) {
    const requests = await prisma.memberClosureRequest.findMany({
      where: { memberId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  /**
   * Approves a voluntary closure request, executing church deactivation with full record retention.
   */
  static async approveClosureRequest(id: string, staffId: string, reviewRemarks?: string, req?: any) {
    const request = await prisma.memberClosureRequest.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!request) {
      throw new AppError('Closure request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot approve a closure request that is already ${request.status}`, 400);
    }

    const inactiveState = (await prisma.dataLookup.findFirst({
      where: { value: CommonObjectState.IN_ACTIVE },
    })) as any;

    if (!inactiveState) {
      throw new AppError('Inactive state lookup not found in database', 500);
    }

    const resolutionDateStr = request.resolutionDate
      ? new Date(request.resolutionDate).toLocaleDateString()
      : 'N/A';

    const inactiveReason = `Voluntary Closure [${request.closureType}]: ${request.reason} (Resolution: ${resolutionDateStr}${
      reviewRemarks ? ` | Ref: ${reviewRemarks}` : ''
    })`;

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark request as APPROVED
      const updatedRequest = await tx.memberClosureRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: staffId,
          reviewedAt: new Date(),
          reviewRemarks: reviewRemarks?.trim() || null,
        },
      });

      // 2. Deactivate Member with VOLUNTARILY_CLOSED action state
      const updatedMember = await tx.member.update({
        where: { id: request.memberId },
        data: {
          isActive: false,
          stateId: inactiveState.id,
          currentActionState: 'VOLUNTARILY_CLOSED',
          reasonForInactive: inactiveReason,
        },
        include: {
          councilFellowship: true,
          region: true,
        },
      });

      // 3. Deactivate associated church users
      await tx.churchUser.updateMany({
        where: { memberId: request.memberId },
        data: { isActive: false },
      });

      // 4. Create ActionState record
      await tx.actionState.create({
        data: {
          entityType: 'MEMBER',
          entityId: request.memberId,
          state: 'VOLUNTARILY_CLOSED',
          note: `Voluntary closure approved: ${request.reason} (Resolution: ${resolutionDateStr}). Remarks: ${reviewRemarks || 'N/A'}`,
          performedBy: staffId,
        },
      });

      return { updatedRequest, updatedMember };
    });

    // 5. Log activity
    if (req) {
      await logActivity(
        {
          action: ActivityAction.UPDATE,
          entity: ActivityEntity.MEMBER,
          entityId: request.memberId,
          description: `Approved voluntary closure for church "${request.member.name}" (${request.closureType})`,
          metadata: {
            closureRequestId: id,
            closureType: request.closureType,
            resolutionDate: request.resolutionDate,
            reviewRemarks,
          },
        },
        req
      );
    }

    return result;
  }

  /**
   * Rejects a voluntary closure request; church remains active.
   */
  static async rejectClosureRequest(id: string, staffId: string, reviewRemarks: string, req?: any) {
    if (!reviewRemarks || reviewRemarks.trim() === '') {
      throw new AppError('Rejection remarks/reason are required', 400);
    }

    const request = await prisma.memberClosureRequest.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!request) {
      throw new AppError('Closure request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot reject a closure request that is already ${request.status}`, 400);
    }

    const updatedRequest = await prisma.memberClosureRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: staffId,
        reviewedAt: new Date(),
        reviewRemarks: reviewRemarks.trim(),
      },
    });

    if (req) {
      await logActivity(
        {
          action: ActivityAction.UPDATE,
          entity: ActivityEntity.MEMBER,
          entityId: request.memberId,
          description: `Rejected voluntary closure request for church "${request.member.name}": ${reviewRemarks}`,
          metadata: {
            closureRequestId: id,
            reviewRemarks,
          },
        },
        req
      );
    }

    return updatedRequest;
  }

  /**
   * Cancels a pending voluntary closure request.
   */
  static async cancelClosureRequest(id: string, cancelledById?: string, req?: any) {
    const request = await prisma.memberClosureRequest.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!request) {
      throw new AppError('Closure request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError('Only pending closure requests can be cancelled', 400);
    }

    const updatedRequest = await prisma.memberClosureRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        reviewRemarks: 'Cancelled by requester',
      },
    });

    if (req) {
      await logActivity(
        {
          action: ActivityAction.UPDATE,
          entity: ActivityEntity.MEMBER,
          entityId: request.memberId,
          description: `Cancelled voluntary closure request for church "${request.member.name}"`,
          metadata: {
            closureRequestId: id,
            cancelledById,
          },
        },
        req
      );
    }

    return updatedRequest;
  }
}
