import express from "express";
import * as ChurchAuthController from "./controllers/church-auth.controller";
import * as ChurchAuthMiddleware from "./middlewares/church-auth.middleware";
import { 
  churchLoginValidator, 
  changePasswordValidator, 
  resetPasswordValidator, 
  handleValidationErrors 
} from "./validators/church-auth.validator";
import { authRateLimiter } from "../../shared/middlewares/rate-limit.middleware";

const router = express.Router();

// Login church user with rate limiting defense
router.post(
  "/login",
  authRateLimiter,
  churchLoginValidator,
  handleValidationErrors,
  ChurchAuthController.loginChurchUser
);

// Refresh church user token
router.post(
  "/refresh",
  authRateLimiter,
  ChurchAuthController.refreshChurchToken
);

// Get authenticated church user
router.get(
  "/me",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchAuthController.getAuthenticatedChurchUser
);

// Reset password with rate limiting
router.post(
  "/reset-password",
  authRateLimiter,
  resetPasswordValidator,
  handleValidationErrors,
  ChurchAuthController.resetPassword
);

// Change password (requires authentication)
router.post(
  "/change-password",
  ChurchAuthMiddleware.verifyChurchUser,
  changePasswordValidator,
  handleValidationErrors,
  ChurchAuthController.changePassword
);

export default router;
