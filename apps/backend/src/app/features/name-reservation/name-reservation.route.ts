import { Router } from 'express';
import { checkName, createReservation, getReservations, getReservationById, updateReservationStatus, getReservationByCode } from './controllers/name-reservation.controller';
import * as StaffAuthMiddleware from '../auth/middlewares/auth.middleware';

import cors from 'cors';

const router = Router();

// Configure completely open CORS for the public endpoints
const publicCors = cors({
  origin: function (origin: any, callback: any) { callback(null, true); },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
});

// Preflight options for public routes
router.options('/check', publicCors);
router.options('/public/request', publicCors);
router.options('/public/code/:code', publicCors);

// Public Routes (Used by public website)
router.post('/check', publicCors, checkName);
// Allow public to submit name reservations (requires adjusting the controller to handle optional staffId)
router.post('/public/request', publicCors, createReservation);
router.get('/public/code/:code', publicCors, getReservationByCode);

// Protected Routes (Admin Portal)
router.use(StaffAuthMiddleware.verifyStaff);
router.post('/', createReservation);
router.get('/', getReservations);
router.get('/:id', getReservationById);
router.patch('/:id/status', updateReservationStatus);

export default router;
