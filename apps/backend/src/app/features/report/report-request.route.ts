import { Router } from "express";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import {
  getReportRequests,
  getReportRequest,
  createReportRequest,
  updateReportRequest,
  deleteReportRequest,
} from "./controllers/report-request.controller";

const router = Router();

// All routes require authenticated staff
router.use(StaffAuthMiddleware.verifyStaff);

router.get("/", getReportRequests);
router.get("/:id", getReportRequest);
router.post("/", createReportRequest);
router.patch("/:id", updateReportRequest);
router.delete("/:id", deleteReportRequest);

export default router;
