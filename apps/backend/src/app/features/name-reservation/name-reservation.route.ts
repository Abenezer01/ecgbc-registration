import { Router } from 'express';
import { checkName, createReservation, getReservations, updateReservationStatus } from './controllers/name-reservation.controller';
import * as StaffAuthMiddleware from '../auth/middlewares/auth.middleware';

const router = Router();

router.use(StaffAuthMiddleware.verifyStaff);

// Name Checking & Reservation
router.post('/check', checkName);
router.post('/', createReservation);
router.get('/', getReservations);
router.patch('/:id/status', updateReservationStatus);

export default router;
