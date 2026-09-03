import express from "express";
import * as FinanceController from "./controllers/finance.controller";
import * as FeeRuleController from "./controllers/fee-rule.controller";
import * as PaymentMethodController from "./controllers/payment-method.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import { FinancePermission } from "./enums/finance-permission.enum";
import { restrictStaff } from "../auth/middlewares/auth.middleware";

const router = express.Router();

router.get("/public/verify/:feeId", FinanceController.verifyFeePublic);

router.use(StaffAuthMiddleware.verifyStaff);

// Dashboard summary
router.get(
  "/summary",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FinanceController.getFinanceSummary
);

// Fee rates (deprecated, will be removed)
router.get(
  "/fee-rates",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FinanceController.getCategoryFeeRates
);
router.put(
  "/fee-rates/:categoryId",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FinanceController.upsertCategoryFeeRate
);

// Fee Rules (Settings)
router.get(
  "/fee-rules",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FeeRuleController.getFeeRules
);
router.post(
  "/fee-rules",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FeeRuleController.createFeeRule
);
router.patch(
  "/fee-rules/:id",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FeeRuleController.updateFeeRule
);
router.delete(
  "/fee-rules/:id",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FeeRuleController.deleteFeeRule
);
router.post(
  "/fee-rules/generate-missing/:reportRequestId",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FeeRuleController.generateMissingFees
);

// Reporting fees
router.get(
  "/fees",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FinanceController.getReportingFees
);
router.get(
  "/fees/preview",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FinanceController.getFeePreview
);
router.post(
  "/fees/generate",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FinanceController.generateFee
);
router.patch(
  "/fees/:id/send",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FinanceController.sendFee
);
router.patch(
  "/fees/:id/pay",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  FinanceController.markFeePaid
);

// Payment Verification
router.post(
  "/verify",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  FinanceController.verifyPayment
);

// Payment Methods Settings
router.get(
  "/payment-methods",
  restrictStaff(FinancePermission.FINANCE_VIEW),
  PaymentMethodController.getPaymentMethods
);
router.put(
  "/payment-methods/:methodId",
  restrictStaff(FinancePermission.FINANCE_MANAGE),
  PaymentMethodController.upsertPaymentMethodConfig
);

export default router;
