import { Request, Response, NextFunction } from 'express';
import { MemberTransferService } from '../../../shared/services/member-transfer.service';

// GET /api/v1/members/:id/transfers
export const getMemberTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await MemberTransferService.getTransfers(id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/members/:id/transfer
export const transferMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string | undefined;

    const result = await MemberTransferService.transferMember(
      {
        memberId: id,
        toFellowshipId: req.body.toFellowshipId,
        toRegionId: req.body.toRegionId,
        transferType: req.body.transferType,
        reason: req.body.reason,
        referenceNumber: req.body.referenceNumber,
        documentUrl: req.body.documentUrl,
        effectiveDate: req.body.effectiveDate,
        toCity: req.body.toCity,
        toSubcity: req.body.toSubcity,
        toZone: req.body.toZone,
        toDistrict: req.body.toDistrict,
        toHouseNumber: req.body.toHouseNumber,
        staffId,
      },
      staffId,
      req
    );

    res.json({
      success: true,
      message: 'Church transferred successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
