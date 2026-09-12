import prisma from '../../config/db.config';

export interface DuplicateDetectionPayload {
  excludeMemberId?: string;
  nameAm?: string;
  nameEn?: string;
  phoneNumber?: string;
  contactPersonPhone?: string;
  regionId?: string;
  city?: string;
  subcity?: string;
  district?: string;
  houseNumber?: string;
  boardMembers?: { fullName: string; phoneNumber?: string }[];
}

export interface DuplicateMatch {
  memberId: string;
  memberName: string;
  score: number;
  reasons: string[];
}

export interface DuplicateMemberSummary {
  id: string;
  name: string;
  nameEn?: string | null;
  certificateNo: string;
  phoneNumber?: string | null;
  city?: string | null;
  subcity?: string | null;
  district?: string | null;
  houseNumber?: string | null;
  isActive: boolean;
  roleOrNote?: string;
}

export interface DuplicateCluster {
  id: string;
  type: 'PHONE' | 'BOARD_MEMBER' | 'LOCATION';
  matchField: string;
  matchValue: string;
  members: DuplicateMemberSummary[];
}

export class DuplicateDetectionService {
  private static readonly SCORE_EXACT_NAME = 100;
  private static readonly SCORE_PARTIAL_NAME = 40;
  private static readonly SCORE_PHONE = 50;
  private static readonly SCORE_BOARD_MEMBER_PHONE = 50;
  private static readonly SCORE_BOARD_MEMBER_NAME = 40; // High enough on its own to trigger duplicate threshold
  private static readonly SCORE_EXACT_LOCATION = 40;
  private static readonly SCORE_PARTIAL_LOCATION = 15;
  private static readonly THRESHOLD = 40;

  static async findPotentialDuplicates(payload: DuplicateDetectionPayload): Promise<DuplicateMatch[]> {
    const phoneNumbers = [payload.phoneNumber, payload.contactPersonPhone].filter(Boolean) as string[];
    const boardMemberPhones = payload.boardMembers?.map(b => b.phoneNumber).filter(Boolean) as string[] || [];
    const boardMemberNames = payload.boardMembers?.map(b => b.fullName).filter(Boolean) as string[] || [];
    const allPhones = [...phoneNumbers, ...boardMemberPhones];

    // Build the OR conditions to fetch candidates
    const orConditions: any[] = [];

    if (payload.nameAm) {
      orConditions.push({ name: { contains: payload.nameAm } });
    }
    if (payload.nameEn) {
      orConditions.push({ nameEn: { contains: payload.nameEn } });
    }
    if (allPhones.length > 0) {
      orConditions.push({ phoneNumber: { in: allPhones } });
      orConditions.push({ contactPerson: { phoneNumber: { in: allPhones } } });
      orConditions.push({ boardMembers: { some: { phoneNumber: { in: allPhones } } } });
    }
    // Board member name matching (with or without phone)
    if (boardMemberNames.length > 0) {
      for (const bName of boardMemberNames) {
        const clean = bName.trim();
        if (clean.length >= 3) {
          orConditions.push({ boardMembers: { some: { fullName: { contains: clean } } } });
          orConditions.push({ boardMembers: { some: { fullNameEn: { contains: clean } } } });
        }
      }
    }
    if (payload.regionId && payload.city && payload.subcity) {
      orConditions.push({
        regionId: payload.regionId,
        city: payload.city,
        subcity: payload.subcity
      });
    }

    if (orConditions.length === 0) {
      return [];
    }

    const candidates = await prisma.member.findMany({
      where: {
        AND: [
          { OR: orConditions },
          payload.excludeMemberId ? { id: { not: payload.excludeMemberId } } : {}
        ]
      },
      include: {
        contactPerson: true,
        boardMembers: true
      }
    });

    const matches: DuplicateMatch[] = [];

    for (const candidate of candidates) {
      let score = 0;
      const reasons: string[] = [];

      // Name Match
      if (payload.nameAm && candidate.name === payload.nameAm) {
        score += this.SCORE_EXACT_NAME;
        reasons.push(`Exact name match: ${candidate.name}`);
      } else if (payload.nameAm && candidate.name.includes(payload.nameAm)) {
        score += this.SCORE_PARTIAL_NAME;
        reasons.push(`Partial name match: ${candidate.name}`);
      }

      // Phone Match
      const candidatePhones = [candidate.phoneNumber, candidate.contactPerson?.phoneNumber].filter(Boolean) as string[];
      for (const phone of phoneNumbers) {
        if (candidatePhones.includes(phone)) {
          score += this.SCORE_PHONE;
          reasons.push(`Phone number match: ${phone}`);
          break;
        }
      }

      // Location Match
      if (payload.regionId && payload.city && payload.subcity && payload.district && payload.houseNumber) {
        if (
          candidate.regionId === payload.regionId &&
          candidate.city === payload.city &&
          candidate.subcity === payload.subcity &&
          candidate.district === payload.district &&
          candidate.houseNumber === payload.houseNumber
        ) {
          score += this.SCORE_EXACT_LOCATION;
          reasons.push('Exact location match');
        } else if (candidate.regionId === payload.regionId && candidate.city === payload.city && candidate.subcity === payload.subcity) {
          score += this.SCORE_PARTIAL_LOCATION;
          reasons.push('Partial location match (Region, City, Subcity)');
        }
      }

      // Board Member Match: Supports WITH phone, WITHOUT phone (by name), or BOTH
      if (payload.boardMembers && payload.boardMembers.length > 0) {
        for (const inputBm of payload.boardMembers) {
          const inputName = inputBm.fullName?.trim().toLowerCase();
          const inputPhone = inputBm.phoneNumber?.trim().replace(/\s+/g, '');

          for (const candBm of candidate.boardMembers) {
            const candName = candBm.fullName?.trim().toLowerCase();
            const candNameEn = candBm.fullNameEn?.trim().toLowerCase();
            const candPhone = candBm.phoneNumber?.trim().replace(/\s+/g, '');

            const phoneMatches = Boolean(inputPhone && candPhone && inputPhone === candPhone);
            const nameMatches = Boolean(
              inputName &&
              (inputName === candName ||
                (candNameEn && inputName === candNameEn) ||
                (inputName.length >= 4 && (candName?.includes(inputName) || inputName.includes(candName || ''))))
            );

            if (phoneMatches && nameMatches) {
              score += this.SCORE_BOARD_MEMBER_PHONE + this.SCORE_BOARD_MEMBER_NAME;
              reasons.push(`Board member match (Name & Phone): ${candBm.fullName} (${candBm.phoneNumber})`);
            } else if (phoneMatches) {
              score += this.SCORE_BOARD_MEMBER_PHONE;
              reasons.push(`Board member phone match: ${candBm.phoneNumber} (Leader: ${candBm.fullName})`);
            } else if (nameMatches) {
              score += this.SCORE_BOARD_MEMBER_NAME;
              reasons.push(`Board member name overlap (without phone): ${candBm.fullName}`);
            }
          }
        }
      }

      if (score >= this.THRESHOLD) {
        matches.push({
          memberId: candidate.id,
          memberName: candidate.name,
          score,
          reasons: [...new Set(reasons)]
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Scans all existing registered members to find collision clusters
   * across phone numbers, board members (with and without phone), and exact addresses.
   */
  static async auditExistingDuplicates(): Promise<DuplicateCluster[]> {
    const clusters: DuplicateCluster[] = [];

    // 1. Phone number collisions across members and contact persons
    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        certificateNo: true,
        phoneNumber: true,
        city: true,
        subcity: true,
        district: true,
        houseNumber: true,
        isActive: true,
        regionId: true,
        contactPerson: {
          select: {
            phoneNumber: true,
            fullName: true,
          }
        }
      }
    });

    const phoneToMembers = new Map<string, Map<string, DuplicateMemberSummary>>();

    for (const m of members) {
      const summary: DuplicateMemberSummary = {
        id: m.id,
        name: m.name,
        nameEn: m.nameEn,
        certificateNo: m.certificateNo,
        phoneNumber: m.phoneNumber,
        city: m.city,
        subcity: m.subcity,
        district: m.district,
        houseNumber: m.houseNumber,
        isActive: m.isActive,
      };

      if (m.phoneNumber && m.phoneNumber.trim().length >= 7) {
        const cleanPhone = m.phoneNumber.trim().replace(/\s+/g, '');
        if (!phoneToMembers.has(cleanPhone)) phoneToMembers.set(cleanPhone, new Map());
        phoneToMembers.get(cleanPhone)!.set(m.id, { ...summary, roleOrNote: 'Church Phone' });
      }

      if (m.contactPerson?.phoneNumber && m.contactPerson.phoneNumber.trim().length >= 7) {
        const cleanPhone = m.contactPerson.phoneNumber.trim().replace(/\s+/g, '');
        if (!phoneToMembers.has(cleanPhone)) phoneToMembers.set(cleanPhone, new Map());
        phoneToMembers.get(cleanPhone)!.set(m.id, {
          ...summary,
          roleOrNote: `Contact: ${m.contactPerson.fullName} (${cleanPhone})`
        });
      }
    }

    for (const [phone, memberMap] of phoneToMembers.entries()) {
      if (memberMap.size > 1) {
        clusters.push({
          id: `phone-${phone}`,
          type: 'PHONE',
          matchField: 'Phone Number',
          matchValue: phone,
          members: Array.from(memberMap.values())
        });
      }
    }

    // 2. Board member overlap: BOTH with phone AND without phone (by name)
    const boardMembers = await prisma.boardMember.findMany({
      where: {
        memberId: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        phoneNumber: true,
        memberId: true,
        member: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            certificateNo: true,
            phoneNumber: true,
            city: true,
            subcity: true,
            district: true,
            houseNumber: true,
            isActive: true,
          }
        }
      }
    });

    const bmPhoneToMembers = new Map<string, Map<string, DuplicateMemberSummary>>();
    const bmNameToMembers = new Map<string, { displayName: string; members: Map<string, DuplicateMemberSummary> }>();

    for (const bm of boardMembers) {
      if (!bm.member || !bm.memberId) continue;
      const phoneLabel = bm.phoneNumber?.trim() ? bm.phoneNumber.trim() : 'No phone';
      const summary: DuplicateMemberSummary = {
        id: bm.member.id,
        name: bm.member.name,
        nameEn: bm.member.nameEn,
        certificateNo: bm.member.certificateNo,
        phoneNumber: bm.member.phoneNumber,
        city: bm.member.city,
        subcity: bm.member.subcity,
        district: bm.member.district,
        houseNumber: bm.member.houseNumber,
        isActive: bm.member.isActive,
        roleOrNote: `Board Member: ${bm.fullName} (${phoneLabel})`
      };

      // Group by phone (when phone is provided)
      if (bm.phoneNumber && bm.phoneNumber.trim().length >= 7) {
        const cleanPhone = bm.phoneNumber.trim().replace(/\s+/g, '');
        if (!bmPhoneToMembers.has(cleanPhone)) bmPhoneToMembers.set(cleanPhone, new Map());
        bmPhoneToMembers.get(cleanPhone)!.set(bm.memberId, summary);
      }

      // Group by name (without requiring phone)
      if (bm.fullName && bm.fullName.trim().length >= 3) {
        const cleanName = bm.fullName.trim().toLowerCase();
        if (!bmNameToMembers.has(cleanName)) {
          bmNameToMembers.set(cleanName, {
            displayName: bm.fullName.trim(),
            members: new Map()
          });
        }
        bmNameToMembers.get(cleanName)!.members.set(bm.memberId, summary);
      }
    }

    // A. Clusters for Board Member Phone Overlap
    for (const [phone, memberMap] of bmPhoneToMembers.entries()) {
      if (memberMap.size > 1) {
        clusters.push({
          id: `bm-phone-${phone}`,
          type: 'BOARD_MEMBER',
          matchField: 'Board Member Phone',
          matchValue: phone,
          members: Array.from(memberMap.values())
        });
      }
    }

    // B. Clusters for Board Member Name Overlap (Without Phone Requirement)
    for (const [nameKey, group] of bmNameToMembers.entries()) {
      if (group.members.size > 1) {
        clusters.push({
          id: `bm-name-${nameKey}`,
          type: 'BOARD_MEMBER',
          matchField: 'Board Member Name (Without Phone)',
          matchValue: group.displayName,
          members: Array.from(group.members.values())
        });
      }
    }

    // 3. Exact Address Collisions
    const addressToMembers = new Map<string, Map<string, DuplicateMemberSummary>>();

    for (const m of members) {
      if (m.houseNumber && m.houseNumber.trim().length > 0 && m.city && m.city.trim().length > 0) {
        const key = [
          (m.regionId || '').trim(),
          (m.city || '').trim().toLowerCase(),
          (m.subcity || '').trim().toLowerCase(),
          (m.district || '').trim().toLowerCase(),
          (m.houseNumber || '').trim().toLowerCase(),
        ].join(' | ');

        if (!addressToMembers.has(key)) addressToMembers.set(key, new Map());
        addressToMembers.get(key)!.set(m.id, {
          id: m.id,
          name: m.name,
          nameEn: m.nameEn,
          certificateNo: m.certificateNo,
          phoneNumber: m.phoneNumber,
          city: m.city,
          subcity: m.subcity,
          district: m.district,
          houseNumber: m.houseNumber,
          isActive: m.isActive,
          roleOrNote: `House No: ${m.houseNumber}, ${m.subcity || ''}`
        });
      }
    }

    for (const [address, memberMap] of addressToMembers.entries()) {
      if (memberMap.size > 1) {
        clusters.push({
          id: `addr-${address}`,
          type: 'LOCATION',
          matchField: 'Exact Address',
          matchValue: address,
          members: Array.from(memberMap.values())
        });
      }
    }

    return clusters;
  }
}
