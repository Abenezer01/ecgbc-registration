import { body, check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const updateMemberReportValidator = [
  body("reportId").isUUID().withMessage("report must be UUID"),
  // body("report").notEmpty().withMessage("Report file is required."),
  validate,
];

export const updateFellowshipReportValidator = [
  body("year").not().isEmpty().withMessage("year is required."),
  body("member").isUUID().withMessage("member must be UUID"),
  validate,
];
