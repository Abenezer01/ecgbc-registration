import express from "express";
import * as AuthController from "./controllers/auth.controller";
import * as StaffAuthMiddleware from "./middlewares/auth.middleware";
import { loginValidator } from "./validators/login.validator";

const router = express.Router();

// Log in user
router.post("/login", loginValidator, AuthController.loginStaff);

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
