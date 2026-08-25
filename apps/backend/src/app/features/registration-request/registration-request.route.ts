import { Router } from 'express';
import { submitRegistration, getRegistrations, getRegistrationById, approveRegistration, rejectRegistration } from './controllers/registration-request.controller';
import * as StaffAuthMiddleware from '../auth/middlewares/auth.middleware';
import * as FileController from '../file/controllers/file.controller';

import cors from 'cors';

const router = Router();

// Configure completely open CORS for the public endpoints
const publicCors = cors({
  origin: function (origin: any, callback: any) { callback(null, true); },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
});

// Preflight options for public routes
router.options('/public/apply', publicCors);

// Public Route (Used by Church Portal for new applicants)
router.post('/public/apply', publicCors, FileController.uploadMemberFiles.pre, FileController.uploadMemberFiles.post, submitRegistration);

// Protected Routes (Admin Portal)
router.use(StaffAuthMiddleware.verifyStaff);
router.get('/', getRegistrations);
router.get('/:id', getRegistrationById);
router.post('/:id/approve', approveRegistration);
router.post('/:id/reject', rejectRegistration);

export default router;
