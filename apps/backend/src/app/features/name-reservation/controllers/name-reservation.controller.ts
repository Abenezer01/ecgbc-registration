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
  const { nameAm, nameEn } = req.body;
  const staffId = (req as any).staff?.id;

  if (!nameAm) return next(new AppError('nameAm is required', 400));
  if (!staffId) return next(new AppError('Unauthorized', 401));

  const reservation = await reservationService.createReservation({ nameAm, nameEn, staffId });
  sendSuccessResponse(res, { reservation }, 201);
});

export const getReservations = catchAsync(async (req: Request, res: Response) => {
  const reservations = await reservationService.getReservations();
  sendSuccessResponse(res, { reservations });
});

export const updateReservationStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  const staffId = (req as any).staff?.id;

  if (!status) return next(new AppError('status is required', 400));

  const reservation = await reservationService.updateReservationStatus(id, status, staffId);
  sendSuccessResponse(res, { reservation });
});
