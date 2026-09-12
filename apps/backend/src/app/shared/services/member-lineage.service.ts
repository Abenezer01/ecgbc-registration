import prisma from '../../config/db.config';
import AppError from '../errors/app.error';

export interface MergeMembersParams {
  successorId: string;
  predecessorIds: string[];
  effectiveDate?: Date | string;
  reason: string;
  notes?: string;
  staffId?: string;
}

export interface SplitMemberParams {
  parentMemberId: string;
  daughterMemberIds: string[];
  parentDisposition: 'KEEP_ACTIVE' | 'MARK_SPLIT';
  effectiveDate?: Date | string;
  reason: string;
  notes?: string;
  staffId?: string;
}

export class MemberLineageService {
  /**
   * Retrieves the complete lineage (parents/predecessors and children/successors) of a church.
   */
  static async getLineage(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, nameEn: true, certificateNo: true, isActive: true, currentActionState: true }
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    // Churches that were parents / predecessors (churches that merged into this one or parented it)
    const parents = await prisma.memberLineage.findMany({
      where: { childMemberId: memberId },
      include: {
        parentMember: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            certificateNo: true,
            city: true,
            subcity: true,
            isActive: true,
            currentActionState: true,
            phoneNumber: true,
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { effectiveDate: 'desc' }
    });

    // Churches that are children / successors (churches this one merged into, or daughter branches)
    const children = await prisma.memberLineage.findMany({
      where: { parentMemberId: memberId },
      include: {
        childMember: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            certificateNo: true,
            city: true,
            subcity: true,
            isActive: true,
            currentActionState: true,
            phoneNumber: true,
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { effectiveDate: 'desc' }
    });

    return {
      currentMember: member,
      parents: parents.map(p => ({
        lineageId: p.id,
        type: p.type as 'MERGE' | 'SPLIT',
        effectiveDate: p.effectiveDate,
        reason: p.reason,
        notes: p.notes,
        staff: p.staff,
        church: p.parentMember
      })),
      children: children.map(c => ({
        lineageId: c.id,
        type: c.type as 'MERGE' | 'SPLIT',
        effectiveDate: c.effectiveDate,
        reason: c.reason,
        notes: c.notes,
        staff: c.staff,
        church: c.childMember
      }))
    };
  }

  /**
   * Executes a church merger: Combines predecessor churches into a successor church.
   * Predecessor historical data (reports, files, certificates) remain intact on their records.
   */
  static async mergeMembers(params: MergeMembersParams) {
    const { successorId, predecessorIds, effectiveDate, reason, notes, staffId } = params;

    if (!successorId) {
      throw new AppError('Successor church ID is required', 400);
    }
    if (!predecessorIds || predecessorIds.length === 0) {
      throw new AppError('At least one predecessor church must be selected for merger', 400);
    }
    if (predecessorIds.includes(successorId)) {
      throw new AppError('A church cannot merge into itself', 400);
    }
    if (!reason || !reason.trim()) {
      throw new AppError('A reason/justification is required for the merger', 400);
    }

    const successor = await prisma.member.findUnique({
      where: { id: successorId },
      select: { id: true, name: true, certificateNo: true }
    });
    if (!successor) {
      throw new AppError('Successor church not found', 404);
    }

    const predecessors = await prisma.member.findMany({
      where: { id: { in: predecessorIds } },
      select: { id: true, name: true, certificateNo: true, isActive: true }
    });

    if (predecessors.length !== predecessorIds.length) {
      throw new AppError('One or more selected predecessor churches do not exist', 404);
    }

    const effDate = effectiveDate ? new Date(effectiveDate) : new Date();

    return await prisma.$transaction(async (tx) => {
      const createdLineages = [];

      for (const pred of predecessors) {
        // 1. Mark predecessor as MERGED & inactive (preserving historical records)
        await tx.member.update({
          where: { id: pred.id },
          data: {
            isActive: false,
            currentActionState: 'MERGED',
            reasonForInactive: `Merged into ${successor.name} (${successor.certificateNo}). Reason: ${reason}`
          }
        });

        // 2. Create parent-child lineage record (Parent = Predecessor, Child = Successor)
        const lineage = await tx.memberLineage.create({
          data: {
            type: 'MERGE',
            parentMemberId: pred.id,
            childMemberId: successor.id,
            effectiveDate: effDate,
            reason,
            notes,
            performedBy: staffId || null
          }
        });
        createdLineages.push(lineage);

        // 3. Record ActionState audit log on predecessor
        if (staffId) {
          await (tx as any).actionState.create({
            data: {
              entityType: 'MEMBER',
              entityId: pred.id,
              state: 'MERGED',
              note: `Merged into ${successor.name}. ${reason}`,
              performedBy: staffId
            }
          });
        }
      }

      // 4. Record ActionState audit log on successor
      if (staffId) {
        const predNames = predecessors.map(p => p.name).join(', ');
        await (tx as any).actionState.create({
          data: {
            entityType: 'MEMBER',
            entityId: successor.id,
            state: 'MERGE_ABSORBED',
            note: `Absorbed church(es): ${predNames}. ${reason}`,
            performedBy: staffId
          }
        });
      }

      return {
        successor,
        predecessors,
        lineages: createdLineages
      };
    });
  }

  /**
   * Executes a church split: Establishes daughter churches branching from a mother church.
   */
  static async splitMember(params: SplitMemberParams) {
    const { parentMemberId, daughterMemberIds, parentDisposition, effectiveDate, reason, notes, staffId } = params;

    if (!parentMemberId) {
      throw new AppError('Parent/Mother church ID is required', 400);
    }
    if (!daughterMemberIds || daughterMemberIds.length === 0) {
      throw new AppError('At least one daughter church must be selected', 400);
    }
    if (daughterMemberIds.includes(parentMemberId)) {
      throw new AppError('A church cannot split into itself', 400);
    }
    if (!reason || !reason.trim()) {
      throw new AppError('A reason/justification is required for the split', 400);
    }

    const parent = await prisma.member.findUnique({
      where: { id: parentMemberId },
      select: { id: true, name: true, certificateNo: true }
    });
    if (!parent) {
      throw new AppError('Mother church not found', 404);
    }

    const daughters = await prisma.member.findMany({
      where: { id: { in: daughterMemberIds } },
      select: { id: true, name: true, certificateNo: true }
    });

    if (daughters.length !== daughterMemberIds.length) {
      throw new AppError('One or more selected daughter churches do not exist', 404);
    }

    const effDate = effectiveDate ? new Date(effectiveDate) : new Date();

    return await prisma.$transaction(async (tx) => {
      const createdLineages = [];

      // 1. If mother church is dissolved into branches
      if (parentDisposition === 'MARK_SPLIT') {
        const daughterNames = daughters.map(d => d.name).join(', ');
        await tx.member.update({
          where: { id: parent.id },
          data: {
            isActive: false,
            currentActionState: 'SPLIT',
            reasonForInactive: `Dissolved into daughter branches: ${daughterNames}. Reason: ${reason}`
          }
        });

        if (staffId) {
          await (tx as any).actionState.create({
            data: {
              entityType: 'MEMBER',
              entityId: parent.id,
              state: 'SPLIT',
              note: `Dissolved into branches: ${daughterNames}. ${reason}`,
              performedBy: staffId
            }
          });
        }
      }

      // 2. Link each daughter church to parent via lineage
      for (const daughter of daughters) {
        const lineage = await tx.memberLineage.create({
          data: {
            type: 'SPLIT',
            parentMemberId: parent.id,
            childMemberId: daughter.id,
            effectiveDate: effDate,
            reason,
            notes,
            performedBy: staffId || null
          }
        });
        createdLineages.push(lineage);

        if (staffId) {
          await (tx as any).actionState.create({
            data: {
              entityType: 'MEMBER',
              entityId: daughter.id,
              state: 'BRANCH_ESTABLISHED',
              note: `Established as daughter branch from ${parent.name}. ${reason}`,
              performedBy: staffId
            }
          });
        }
      }

      return {
        parent,
        daughters,
        lineages: createdLineages
      };
    });
  }
}
