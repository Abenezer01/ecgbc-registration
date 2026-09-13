import { Request, Response, NextFunction } from 'express';
import { MemberClosureService } from '../../../shared/services/member-closure.service';

// POST /api/v1/members/:id/closure-request
export const submitMemberClosure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string | undefined;

    const closureRequest = await MemberClosureService.createClosureRequest(
      {
        memberId: id,
        closureType: req.body.closureType,
        reason: req.body.reason,
        resolutionDate: req.body.resolutionDate,
        effectiveDate: req.body.effectiveDate,
        contactPersonName: req.body.contactPersonName,
        contactPersonPhone: req.body.contactPersonPhone,
        contactPersonEmail: req.body.contactPersonEmail,
        recordsLocation: req.body.recordsLocation,
        resolutionDocumentUrl: req.body.resolutionDocumentUrl,
        submittedByType: 'STAFF',
        submittedById: staffId,
      },
      req
    );

    res.json({
      success: true,
      message: 'Voluntary closure request submitted successfully',
      data: closureRequest,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/members/:id/closure-requests
export const getMemberClosures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requests = await MemberClosureService.getMemberClosureRequests(id);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/closure-requests
export const getAllClosureRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query as any;
    const result = await MemberClosureService.getClosureRequests({
      status,
      search,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/closure-requests/:id
export const getClosureRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await MemberClosureService.getClosureRequestById(id);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/closure-requests/:id/approve
export const approveClosureRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string;

    const result = await MemberClosureService.approveClosureRequest(
      id,
      staffId,
      req.body.reviewRemarks,
      req
    );

    res.json({
      success: true,
      message: 'Voluntary closure approved and church successfully closed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/closure-requests/:id/reject
export const rejectClosureRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const staffId = (req as any).staff?.id as string;

    const result = await MemberClosureService.rejectClosureRequest(
      id,
      staffId,
      req.body.reviewRemarks,
      req
    );

    res.json({
      success: true,
      message: 'Voluntary closure request rejected',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/closure-requests/:id/cancel
export const cancelClosureRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).staff?.id || (req as any).churchUser?.id;

    const result = await MemberClosureService.cancelClosureRequest(id, userId, req);

    res.json({
      success: true,
      message: 'Voluntary closure request cancelled',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Church Portal Endpoints
// POST /api/v1/church-portal/closure-request
export const submitChurchPortalClosure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const churchUser = (req as any).churchUser;
    if (!churchUser?.memberId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated church user' });
    }

    const closureRequest = await MemberClosureService.createClosureRequest(
      {
        memberId: churchUser.memberId,
        closureType: req.body.closureType,
        reason: req.body.reason,
        resolutionDate: req.body.resolutionDate,
        effectiveDate: req.body.effectiveDate,
        contactPersonName: req.body.contactPersonName,
        contactPersonPhone: req.body.contactPersonPhone,
        contactPersonEmail: req.body.contactPersonEmail,
        recordsLocation: req.body.recordsLocation,
        resolutionDocumentUrl: req.body.resolutionDocumentUrl,
        submittedByType: 'CHURCH_USER',
        submittedById: churchUser.id,
      },
      req
    );

    res.json({
      success: true,
      message: 'Voluntary closure request submitted to administration',
      data: closureRequest,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/church-portal/closure-request
export const getChurchPortalClosure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const churchUser = (req as any).churchUser;
    if (!churchUser?.memberId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated church user' });
    }

    const requests = await MemberClosureService.getMemberClosureRequests(churchUser.memberId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/church-portal/closure-request/cancel
export const cancelChurchPortalClosure = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const churchUser = (req as any).churchUser;
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: 'requestId is required' });
    }

    const result = await MemberClosureService.cancelClosureRequest(
      requestId,
      churchUser?.id,
      req
    );

    res.json({
      success: true,
      message: 'Closure request cancelled',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
