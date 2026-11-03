import express from "express";
import * as AuthController from "./controllers/auth.controller";
import * as StaffAuthMiddleware from "./middlewares/auth.middleware";
import { loginValidator } from "./validators/login.validator";
import { authRateLimiter } from "../../shared/middlewares/rate-limit.middleware";

const router = express.Router();

// Log in staff user with rate limiting defense
router.post("/login", authRateLimiter, loginValidator, AuthController.loginStaff);

// Refresh access token
router.post("/refresh", authRateLimiter, AuthController.refreshAccessToken);

router.get(
  "/",
  StaffAuthMiddleware.verifyStaff,
  AuthController.getAuthenticatedStaff
);

router.get(
  "/stat",
  StaffAuthMiddleware.verifyStaff,
  AuthController.getDashboardStats
);

export default router;
