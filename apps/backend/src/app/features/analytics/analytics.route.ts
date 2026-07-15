import express from "express";
import * as AnalyticsController from "./controllers/analytics.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";

const router = express.Router();

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    AnalyticsController.getAnalytics
  );

export default router;
