import { Request, Response } from 'express';
import { NameReservationService } from '../services/name-reservation.service';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response';

const reservationService = new NameReservationService();

export const checkName = async (req: Request, res: Response) => {
  try {
    const { nameAm, nameEn } = req.body;
    if (!nameAm) {
      return sendErrorResponse(res, 400, 'nameAm is required');
    }

    const results = await reservationService.checkNameSimilarity({ nameAm, nameEn });
    sendSuccessResponse(res, { matches: results });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to check name', error);
  }
};

export const createReservation = async (req: Request, res: Response) => {
  try {
    const { nameAm, nameEn } = req.body;
    const staffId = (req as any).staff?.id;

    if (!nameAm) {
      return sendErrorResponse(res, 400, 'nameAm is required');
    }
    if (!staffId) {
      return sendErrorResponse(res, 401, 'Unauthorized');
    }

    const reservation = await reservationService.createReservation({
      nameAm,
      nameEn,
      staffId,
    });

    sendSuccessResponse(res, { reservation }, 'Reservation created successfully');
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to create reservation', error);
  }
};

export const getReservations = async (req: Request, res: Response) => {
  try {
    const reservations = await reservationService.getReservations();
    sendSuccessResponse(res, { reservations });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to fetch reservations', error);
  }
};

export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const staffId = (req as any).staff?.id;

    if (!status) {
      return sendErrorResponse(res, 400, 'status is required');
    }

    const reservation = await reservationService.updateReservationStatus(id, status, staffId);
    sendSuccessResponse(res, { reservation }, 'Status updated successfully');
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to update reservation status', error);
  }
};
