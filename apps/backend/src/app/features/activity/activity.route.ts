import { Router } from "express";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import { getActivityLogs, getActivityLog } from "./controllers/activity.controller";

const router = Router();

// All activity routes require staff authentication
router.use(StaffAuthMiddleware.verifyStaff);

// GET /api/v1/logs - Get activity logs with pagination
router.get("/", getActivityLogs);

// GET /api/v1/logs/:id - Get single activity log
router.get("/:id", getActivityLog);

export default router;
