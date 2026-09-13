import prisma from '../../config/db.config';
import AppError from '../errors/app.error';
import { logActivity, ActivityAction, ActivityEntity } from './activity.service';

export interface TransferMemberParams {
  memberId: string;
  toFellowshipId: string;
  toRegionId?: string;
  transferType?: 'REDISTRICTING' | 'RELOCATION' | 'ADMINISTRATIVE' | 'OTHER';
  reason?: string;
  referenceNumber?: string;
  documentUrl?: string;
  effectiveDate?: Date | string;
  toCity?: string;
  toSubcity?: string;
  toZone?: string;
  toDistrict?: string;
  toHouseNumber?: string;
  staffId?: string;
}

export class MemberTransferService {
  /**
   * Retrieves all historical fellowship and regional transfers for a church.
   */
  static async getTransfers(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        certificateNo: true,
        isActive: true,
        currentActionState: true,
        councilFellowshipId: true,
        regionId: true,
        city: true,
        subcity: true,
        zone: true,
        district: true,
        houseNumber: true,
        councilFellowship: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            region: { select: { id: true, description: true, value: true } },
          },
        },
        region: {
          select: { id: true, description: true, value: true },
        },
      },
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    const transfers = await prisma.memberTransfer.findMany({
      where: { memberId },
      include: {
        fromFellowship: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            region: { select: { id: true, description: true, value: true } },
          },
        },
        toFellowship: {
          select: {
            id: true,
            name: true,
            certificateNo: true,
            region: { select: { id: true, description: true, value: true } },
          },
        },
        fromRegion: { select: { id: true, description: true, value: true } },
        toRegion: { select: { id: true, description: true, value: true } },
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      currentMember: member,
      transfers,
    };
  }

  /**
   * Executes a church fellowship / regional transfer while preserving complete member history.
   */
  static async transferMember(params: TransferMemberParams, staffId?: string, req?: any) {
    const {
      memberId,
      toFellowshipId,
      toRegionId,
      transferType = 'REDISTRICTING',
      reason,
      referenceNumber,
      documentUrl,
      effectiveDate = new Date(),
      toCity,
      toSubcity,
      toZone,
      toDistrict,
      toHouseNumber,
    } = params;

    const effectiveStaffId = staffId || params.staffId || null;

    // 1. Fetch existing member
    const currentMember = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        councilFellowship: true,
        region: true,
      },
    });

    if (!currentMember) {
      throw new AppError('Member church not found', 404);
    }

    if (!currentMember.isActive) {
      throw new AppError('Cannot transfer an inactive, merged, or dissolved church', 400);
    }

    // 2. Fetch destination fellowship
    const toFellowship = await prisma.councilFellowship.findUnique({
      where: { id: toFellowshipId },
      include: { region: true },
    });

    if (!toFellowship) {
      throw new AppError('Destination council fellowship not found', 404);
    }

    // Determine target region: if provided, use it; else default to fellowship's region or current member region
    const resolvedToRegionId = toRegionId || toFellowship.regionId || currentMember.regionId || null;

    const hasLocationChange =
      toCity !== undefined ||
      toSubcity !== undefined ||
      toZone !== undefined ||
      toDistrict !== undefined ||
      toHouseNumber !== undefined;

    // Validate that this is a meaningful transfer
    if (
      currentMember.councilFellowshipId === toFellowshipId &&
      currentMember.regionId === resolvedToRegionId &&
      !hasLocationChange
    ) {
      throw new AppError(
        'Church is already assigned to this fellowship and region with no address changes',
        400
      );
    }

    const effDate = new Date(effectiveDate);

    // 3. Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create immutable historical transfer record
      const transferRecord = await tx.memberTransfer.create({
        data: {
          memberId,
          fromFellowshipId: currentMember.councilFellowshipId,
          toFellowshipId,
          fromRegionId: currentMember.regionId || null,
          toRegionId: resolvedToRegionId,
          fromCity: currentMember.city || null,
          fromSubcity: currentMember.subcity || null,
          fromZone: currentMember.zone || null,
          fromDistrict: currentMember.district || null,
          fromHouseNumber: currentMember.houseNumber || null,
          toCity: toCity !== undefined ? toCity : currentMember.city,
          toSubcity: toSubcity !== undefined ? toSubcity : currentMember.subcity,
          toZone: toZone !== undefined ? toZone : currentMember.zone,
          toDistrict: toDistrict !== undefined ? toDistrict : currentMember.district,
          toHouseNumber: toHouseNumber !== undefined ? toHouseNumber : currentMember.houseNumber,
          transferType,
          reason: reason || null,
          referenceNumber: referenceNumber || null,
          documentUrl: documentUrl || null,
          effectiveDate: effDate,
          performedBy: effectiveStaffId,
        },
      });

      // Update Member with new fellowship and location attributes
      const updatedMemberData: any = {
        councilFellowshipId: toFellowshipId,
        ...(resolvedToRegionId ? { regionId: resolvedToRegionId } : {}),
        currentActionState: 'TRANSFERRED',
      };

      if (toCity !== undefined) updatedMemberData.city = toCity;
      if (toSubcity !== undefined) updatedMemberData.subcity = toSubcity;
      if (toZone !== undefined) updatedMemberData.zone = toZone;
      if (toDistrict !== undefined) updatedMemberData.district = toDistrict;
      if (toHouseNumber !== undefined) updatedMemberData.houseNumber = toHouseNumber;

      const updatedMember = await tx.member.update({
        where: { id: memberId },
        data: updatedMemberData,
        include: {
          councilFellowship: true,
          region: true,
        },
      });

      // Record ActionState if staffId is available
      if (effectiveStaffId) {
        await tx.actionState.create({
          data: {
            entityType: 'MEMBER',
            entityId: memberId,
            state: 'TRANSFERRED',
            note: `Transferred from "${currentMember.councilFellowship.name}" to "${toFellowship.name}" (${transferType}). Ref: ${referenceNumber || 'N/A'}`,
            performedBy: effectiveStaffId,
          },
        });
      }

      return { transferRecord, updatedMember };
    });

    // 4. Log to global audit trail
    if (req) {
      await logActivity(
        {
          action: ActivityAction.UPDATE,
          entity: ActivityEntity.MEMBER,
          entityId: memberId,
          description: `Transferred church "${currentMember.name}" from fellowship "${currentMember.councilFellowship.name}" to "${toFellowship.name}" (${transferType})`,
          metadata: {
            transferId: result.transferRecord.id,
            fromFellowshipId: currentMember.councilFellowshipId,
            toFellowshipId,
            fromFellowshipName: currentMember.councilFellowship.name,
            toFellowshipName: toFellowship.name,
            transferType,
            referenceNumber,
            effectiveDate: effDate,
          },
        },
        req
      );
    }

    return result;
  }
}
