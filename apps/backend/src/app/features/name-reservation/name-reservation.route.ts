import { Router } from 'express';
import { checkName, createReservation, getReservations, getReservationById, updateReservationStatus } from './controllers/name-reservation.controller';
import * as StaffAuthMiddleware from '../auth/middlewares/auth.middleware';

const router = Router();

// Public Routes (Used by public website)
router.post('/check', checkName);
// Allow public to submit name reservations (requires adjusting the controller to handle optional staffId)
router.post('/public/request', createReservation);

// Protected Routes (Admin Portal)
router.use(StaffAuthMiddleware.verifyStaff);
router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/status', updateReservationStatus);

export default router;
