import { body, check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const createMemberReportValidator = [
  body("year").not().isEmpty().withMessage("year is required."),

  body("reportedAt")
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage("reportedAt is required."),
  body("member").isUUID().withMessage("member must be UUID"),
  // body("report").notEmpty().withMessage("Report file is required."),
  validate,
];

export const createFellowshipReportValidator = [
  body("year").not().isEmpty().withMessage("year is required."),
  validate,
];
