import { Request, Response, NextFunction } from 'express';
import { DuplicateDetectionService, DuplicateDetectionPayload } from '../../../shared/services/duplicate-detection.service';

// POST /api/v1/members/check-duplicates
export const checkMemberDuplicates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload: DuplicateDetectionPayload = {
      excludeMemberId: req.body.excludeMemberId,
      nameAm: req.body.nameAm,
      nameEn: req.body.nameEn,
      phoneNumber: req.body.phoneNumber,
      contactPersonPhone: req.body.contactPersonPhone,
      regionId: req.body.regionId,
      city: req.body.city,
      subcity: req.body.subcity,
      district: req.body.district,
      houseNumber: req.body.houseNumber,
      boardMembers: req.body.boardMembers
    };

    const duplicates = await DuplicateDetectionService.findPotentialDuplicates(payload);

    res.json({
      success: true,
      data: duplicates
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/duplicates/audit
export const auditMemberDuplicates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clusters = await DuplicateDetectionService.auditExistingDuplicates();

    res.json({
      success: true,
      data: clusters,
      totalClusters: clusters.length,
    });
  } catch (error) {
    next(error);
  }
};
