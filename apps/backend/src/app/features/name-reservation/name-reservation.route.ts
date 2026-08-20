import { Router } from 'express';
import { checkName, createReservation, getReservations, getReservationById, updateReservationStatus } from './controllers/name-reservation.controller';
import * as StaffAuthMiddleware from '../auth/middlewares/auth.middleware';

import cors from 'cors';

const router = Router();

// Configure completely open CORS for the public endpoints
const publicCors = cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Preflight options for public routes
router.options('/check', publicCors);
router.options('/public/request', publicCors);

// Public Routes (Used by public website)
router.post('/check', publicCors, checkName);
// Allow public to submit name reservations (requires adjusting the controller to handle optional staffId)
router.post('/public/request', publicCors, createReservation);

// Protected Routes (Admin Portal)
router.use(StaffAuthMiddleware.verifyStaff);
router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/status', updateReservationStatus);

export default router;
