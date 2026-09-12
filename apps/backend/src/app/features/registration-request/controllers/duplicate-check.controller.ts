import { Request, Response, NextFunction } from 'express';
import prisma from '../../../config/db.config';
import AppError from '../../../shared/errors/app.error';
import { DuplicateDetectionService, DuplicateDetectionPayload } from '../../../shared/services/duplicate-detection.service';

// GET /api/v1/registration-requests/:id/duplicates
export const checkRegistrationDuplicates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await (prisma as any).registrationRequest.findUnique({
      where: { id }
    });

    if (!request) {
      throw new AppError('Registration request not found', 404);
    }

    const boardMembers: { fullName: string; phoneNumber?: string }[] = [];
    if (request.contactPersonName) {
      boardMembers.push({
        fullName: request.contactPersonName,
        phoneNumber: request.contactPersonPhone || undefined,
      });
    }

    const payload: DuplicateDetectionPayload = {
      nameAm: request.nameAm,
      nameEn: request.nameEn || undefined,
      phoneNumber: request.phoneNumber || undefined,
      contactPersonPhone: request.contactPersonPhone || undefined,
      regionId: request.regionId || undefined,
      city: request.city || undefined,
      subcity: request.subcity || undefined,
      district: request.district || undefined,
      houseNumber: request.houseNumber || undefined,
      boardMembers: boardMembers.length > 0 ? boardMembers : undefined,
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
