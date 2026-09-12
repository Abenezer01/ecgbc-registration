import { Request, Response, NextFunction } from 'express';
import { MemberLineageService } from '../../../shared/services/member-lineage.service';

// GET /api/v1/members/:id/lineage
export const getMemberLineage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await MemberLineageService.getLineage(id);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members/:id/merge
export const mergeIntoMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string | undefined;

    const result = await MemberLineageService.mergeMembers({
      successorId: id,
      predecessorIds: req.body.predecessorIds,
      effectiveDate: req.body.effectiveDate,
      reason: req.body.reason,
      notes: req.body.notes,
      staffId
    });

    res.json({
      success: true,
      message: 'Churches merged successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members/:id/split
export const splitMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string | undefined;

    const result = await MemberLineageService.splitMember({
      parentMemberId: id,
      daughterMemberIds: req.body.daughterMemberIds,
      parentDisposition: req.body.parentDisposition || 'KEEP_ACTIVE',
      effectiveDate: req.body.effectiveDate,
      reason: req.body.reason,
      notes: req.body.notes,
      staffId
    });

    res.json({
      success: true,
      message: 'Church split completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
