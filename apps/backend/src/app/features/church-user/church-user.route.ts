import express from "express";
import * as ChurchUserController from "./controllers/church-user.controller";
import { 
  createChurchUserValidator, 
  updateChurchUserValidator, 
  adminResetPasswordValidator,
  handleValidationErrors 
} from "./validators/church-user.validator";

const router = express.Router();

// Get all church users (with pagination and filtering)
router.get("/", ChurchUserController.getChurchUsers);

// Get church users by member ID
router.get("/member/:memberId", ChurchUserController.getChurchUsersByMember);

// Get single church user by ID
router.get("/:id", ChurchUserController.getChurchUser);

// Create new church user
router.post(
  "/",
  createChurchUserValidator,
  handleValidationErrors,
  ChurchUserController.createChurchUser
);

// Update church user
router.patch(
  "/:id",
  updateChurchUserValidator,
  handleValidationErrors,
  ChurchUserController.updateChurchUser
);

// Delete church user (soft delete)
router.delete("/:id", ChurchUserController.deleteChurchUser);

// Reset user password (admin function)
router.post(
  "/:id/reset-password",
  adminResetPasswordValidator,
  handleValidationErrors,
  ChurchUserController.resetUserPassword
);

// Toggle user status (activate/deactivate)
router.patch("/:id/status", ChurchUserController.toggleUserStatus);

export default router;
