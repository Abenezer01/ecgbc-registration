import { NextFunction, Request, Response } from 'express';
import { NameReservationService } from '../services/name-reservation.service';
import { sendSuccessResponse } from '../../../shared/helpers/response.helper';
import { catchAsync } from '../../../config/error.config';
import AppError from '../../../shared/errors/app.error';

const reservationService = new NameReservationService();

export const checkName = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { nameAm, nameEn } = req.body;
  if (!nameAm) return next(new AppError('nameAm is required', 400));

  const results = await reservationService.checkNameSimilarity({ nameAm, nameEn });
  sendSuccessResponse(res, { matches: results });
});

export const createReservation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { nameAm, nameEn, publicName, publicPhone, publicEmail } = req.body;
  const staffId = (req as any).staff?.id; // will be undefined for public requests

  if (!nameAm) return next(new AppError('nameAm is required', 400));
  // If it's a public request, they should provide contact info
  if (!staffId && !publicPhone && !publicEmail) {
    return next(new AppError('Public requests require either phone or email for contact', 400));
  }

  const reservation = await reservationService.createReservation({
    nameAm, nameEn, staffId, publicName, publicPhone, publicEmail
  });
  sendSuccessResponse(res, { reservation }, 201);
});

export const getReservations = catchAsync(async (req: Request, res: Response) => {
  const reservations = await reservationService.getReservations();
  sendSuccessResponse(res, { reservations });
});

export const getReservationById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const reservation = await reservationService.getReservationById(req.params.id);
  if (!reservation) return next(new AppError('Reservation not found', 404));
  sendSuccessResponse(res, { reservation });
});

export const updateReservationStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status, remark } = req.body;
  const staffId = (req as any).staff.id;

  if (!status) return next(new AppError('status is required', 400));

  const reservation = await reservationService.updateReservationStatus(req.params.id, status, staffId, remark);
  sendSuccessResponse(res, { reservation });
});
