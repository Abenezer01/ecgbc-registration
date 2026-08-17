import { PrismaClient } from '@prisma/client';
import { calculateNameSimilarityScore } from '../../../shared/utils/name-matcher/scorer';

const prisma = new PrismaClient();

export interface CheckNameDto {
  nameAm: string;
  nameEn?: string;
}

export class NameReservationService {
  /**
   * Checks the similarity of a requested name against all existing members and fellowships.
   */
  async checkNameSimilarity(dto: CheckNameDto) {
    const { nameAm, nameEn = '' } = dto;

    // Fetch all members (churches) and fellowships
    const members = await prisma.member.findMany({
      select: { id: true, name: true, nameEn: true, isActive: true },
    });

    const fellowships = await prisma.councilFellowship.findMany({
      select: { id: true, name: true, isActive: true },
    });

    const results = [];

    for (const member of members) {
      const existingAm = member.name || '';
      const existingEn = member.nameEn || '';

      const scoreResult = calculateNameSimilarityScore(
        existingAm,
        existingEn,
        nameAm,
        nameEn
      );

      if (scoreResult.finalScore > 50) { // Only return somewhat similar matches
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
      const existingEn = ''; // Fellowships currently only have one name field

      const scoreResult = calculateNameSimilarityScore(
        existingAm,
        existingEn,
        nameAm,
        nameEn
      );

      if (scoreResult.finalScore > 50) {
        results.push({
          entityId: fellowship.id,
          entityType: 'FELLOWSHIP',
          nameAm: existingAm,
          nameEn: existingEn,
          isActive: fellowship.isActive,
          score: scoreResult.finalScore,
          flags: scoreResult.ruleFlags,
        });
      }
    }

    // Sort by highest score first
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  async createReservation(dto: { nameAm: string; nameEn?: string; staffId: string }) {
    // Before creating, check similarity and store the top matches as JSON
    const similarityResults = await this.checkNameSimilarity({
      nameAm: dto.nameAm,
      nameEn: dto.nameEn,
    });

    const topMatches = similarityResults.slice(0, 5); // Store top 5 matches
    const hasHighSimilarity = topMatches.some((m) => m.score >= 85);

    // If there is an exact or very close match, we can either auto-reject or flag for review.
    // For now, we just create it as PENDING and let staff review.
    return await prisma.nameReservation.create({
      data: {
        requestedNameAm: dto.nameAm,
        requestedNameEn: dto.nameEn,
        requestedBy: dto.staffId,
        similarityData: JSON.stringify(topMatches),
        status: hasHighSimilarity ? 'PENDING' : 'APPROVED', // Auto-approve if no conflict
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

  async updateReservationStatus(id: string, status: string, staffId: string) {
    return await prisma.nameReservation.update({
      where: { id },
      data: {
        status,
        reviewedBy: staffId,
        reviewedAt: new Date(),
      },
    });
  }
}
