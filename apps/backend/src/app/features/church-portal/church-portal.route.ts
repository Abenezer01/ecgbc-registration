import express from "express";
import * as ChurchPortalController from "./controllers/church-portal.controller";
import * as ChurchAuthMiddleware from "../church-auth/middlewares/church-auth.middleware";
import { getEnabledPaymentMethods } from "../finance/controllers/payment-method.controller";
import { verifyPayment } from "../finance/controllers/finance.controller";
import {
  DESTINANTIONS,
  FILTERS,
  multerConfig,
  RESOURCES,
} from "../../config/multer.config";

const uploadReport = multerConfig(
  RESOURCES.REPORT,
  DESTINANTIONS.FILE.REPORT,
  FILTERS.REPORT
);

const uploadReportMiddleware = {
  pre: uploadReport.single("report"),
  post: (req: any, _: any, next: any) => {
    if (req.file) {
      req.body.file = req.file.filename;
    }
    next();
  },
};

const router = express.Router();

// Get church profile
router.get(
  "/profile",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getChurchProfile
);

// Update church profile
router.patch(
  "/profile",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.updateChurchProfile
);

// Get church files
router.get(
  "/files",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getChurchPortalFiles
);

// Get church reports
router.get(
  "/reports",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getChurchPortalReports
);

// Get church report requests
router.get(
  "/report-requests",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getChurchPortalReportRequests
);

// Get fee preview
router.get(
  "/fee-preview",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getChurchPortalFeePreview
);

// Get enabled payment methods for church users
router.get(
  "/payment-methods",
  ChurchAuthMiddleware.verifyChurchUser,
  getEnabledPaymentMethods
);

// Verify payment receipt
router.post(
  "/verify",
  ChurchAuthMiddleware.verifyChurchUser,
  verifyPayment
);

// Create church report
router.post(
  "/reports",
  ChurchAuthMiddleware.verifyChurchUser,
  uploadReportMiddleware.pre,
  uploadReportMiddleware.post,
  ChurchPortalController.createChurchPortalReport
);

// Submit report payment
router.patch(
  "/reports/:id/payment",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.submitReportPayment
);

// Get dashboard statistics
router.get(
  "/stats",
  ChurchAuthMiddleware.verifyChurchUser,
  ChurchPortalController.getDashboardStats
);

export default router;
