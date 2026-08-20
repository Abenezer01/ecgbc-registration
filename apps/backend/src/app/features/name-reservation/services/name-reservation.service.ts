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
    nameAm: string;
    nameEn?: string;
    staffId?: string;
    publicName?: string;
    publicPhone?: string;
    publicEmail?: string;
  }) {
    const similarityResults = await this.checkNameSimilarity({ nameAm: dto.nameAm, nameEn: dto.nameEn });
    const topMatches = similarityResults.slice(0, 5);
    const hasHighSimilarity = topMatches.some((m) => m.score >= 85);

    return await prisma.nameReservation.create({
      data: {
        requestedNameAm: dto.nameAm,
        requestedNameEn: dto.nameEn,
        requestedBy: dto.staffId,
        publicRequesterName: dto.publicName,
        publicRequesterPhone: dto.publicPhone,
        publicRequesterEmail: dto.publicEmail,
        similarityData: JSON.stringify(topMatches),
        status: hasHighSimilarity ? 'PENDING' : 'APPROVED',
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

  async updateReservationStatus(id: string, status: string, staffId: string, remark?: string) {
    return await prisma.nameReservation.update({
      where: { id },
      data: { status, reviewedBy: staffId, reviewedAt: new Date(), remark },
    });
  }
}
