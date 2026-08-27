import prisma from '../../../config/db.config';
import { calculateNameSimilarityScore } from '../../../shared/utils/name-matcher/scorer';

export interface CheckNameDto {
  nameAm: string;
  nameEn?: string;
}

export class NameReservationService {
  async checkNameSimilarity(dto: CheckNameDto) {
    const { nameAm, nameEn = '' } = dto;

    const members = await prisma.member.findMany({
      select: { id: true, name: true, nameEn: true, isActive: true },
    });

    const fellowships = await prisma.councilFellowship.findMany({
      select: { id: true, name: true, isActive: true },
    });

    const results = [];

    for (const member of members) {
      const existingAm = member.name || '';
      const existingEn = (member as any).nameEn || '';

      const scoreResult = calculateNameSimilarityScore(existingAm, existingEn, nameAm, nameEn);

      if (scoreResult.finalScore > 50) {
        results.push({
          entityId: member.id,
          entityType: 'MEMBER',
          nameAm: existingAm,
          nameEn: existingEn,
          isActive: member.isActive,
          score: scoreResult.finalScore,
          flags: scoreResult.ruleFlags,
        });
      }
    }

    for (const fellowship of fellowships) {
      const existingAm = fellowship.name || '';

      const scoreResult = calculateNameSimilarityScore(existingAm, '', nameAm, nameEn);

      if (scoreResult.finalScore > 50) {
        results.push({
          entityId: fellowship.id,
          entityType: 'FELLOWSHIP',
          nameAm: existingAm,
          nameEn: '',
          isActive: fellowship.isActive,
          score: scoreResult.finalScore,
          flags: scoreResult.ruleFlags,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  async createReservation(dto: {
    proposedNames?: Array<{ nameAm: string; nameEn: string }>;
    nameAm: string;
    nameEn?: string;
    staffId?: string;
    publicName?: string;
    publicPhone?: string;
    publicEmail?: string;
  }) {
    // Generate a unique 6-character reservation code
    const reservationCode = "ECG-" + Math.floor(1000 + Math.random() * 9000).toString();

    return await prisma.nameReservation.create({
      data: {
        reservationCode,
        proposedNames: dto.proposedNames ? (dto.proposedNames as any) : undefined,
        requestedNameAm: dto.nameAm,
        requestedNameEn: dto.nameEn,
        requestedBy: dto.staffId,
        publicRequesterName: dto.publicName,
        publicRequesterPhone: dto.publicPhone,
        publicRequesterEmail: dto.publicEmail,
      },
    });
  }

  async getReservations() {
    return await prisma.nameReservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getReservationById(id: string) {
    return await prisma.nameReservation.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
  
  async getReservationByCode(code: string) {
    return await prisma.nameReservation.findUnique({ where: { reservationCode: code } });
  }

  async updateReservationStatus(id: string, status: string, staffId: string, remark?: string, finalNameAm?: string, finalNameEn?: string) {
    return await prisma.nameReservation.update({
      where: { id },
      data: { 
        status, 
        reviewedBy: staffId, 
        reviewedAt: new Date(), 
        remark,
        ...(status === "APPROVED" && finalNameAm ? { requestedNameAm: finalNameAm, requestedNameEn: finalNameEn } : {})
      },
    });
  }
}
