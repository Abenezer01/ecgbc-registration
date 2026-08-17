import { Router } from 'express';
import {
  checkName,
  createReservation,
  getReservations,
  updateReservationStatus
} from '../controllers/name-reservation.controller';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

const checkNameSchema = z.object({
  body: z.object({
    nameAm: z.string().min(2),
    nameEn: z.string().optional(),
  }),
});

const statusUpdateSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'USED', 'EXPIRED']),
  }),
});

// Protect all routes
router.use(authenticate);

// Name Checking & Reservation
router.post('/check', validate(checkNameSchema), checkName);
router.post('/', validate(checkNameSchema), createReservation);
router.get('/', getReservations);
router.patch('/:id/status', validate(statusUpdateSchema), updateReservationStatus);

export default router;
