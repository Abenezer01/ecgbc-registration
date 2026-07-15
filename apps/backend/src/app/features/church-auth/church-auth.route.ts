import express from "express";
import * as ChurchAuthController from "./controllers/church-auth.controller";
import * as ChurchAuthMiddleware from "./middlewares/church-auth.middleware";
import { 
  churchLoginValidator, 
  changePasswordValidator, 
  resetPasswordValidator,
  handleValidationErrors 
} from "./validators/church-auth.validator";

const router = express.Router();

// Login church user
router.post(
  "/login",
  churchLoginValidator,
  handleValidationErrors,
  ChurchAuthController.loginChurchUser
);

// Get authenticated church user
router.get(
  "/me",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchAuthController.getAuthenticatedChurchUser
);

// Reset password
router.post(
  "/reset-password",
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
