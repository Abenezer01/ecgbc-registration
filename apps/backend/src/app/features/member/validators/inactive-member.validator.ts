import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const inactiveMemberValidator = [
  check("reason").not().isEmpty().withMessage("reason is required."),
  validate,
];
