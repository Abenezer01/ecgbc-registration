import { Router } from "express";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import {
  getReportRequests,
  createReportRequest,
  updateReportRequest,
  deleteReportRequest,
} from "./controllers/report-request.controller";

const router = Router();

// All routes require authenticated staff
router.use(StaffAuthMiddleware.verifyStaff);

router.get("/", getReportRequests);
router.post("/", createReportRequest);
router.patch("/:id", updateReportRequest);
router.delete("/:id", deleteReportRequest);

export default router;
