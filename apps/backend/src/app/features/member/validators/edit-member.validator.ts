import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editMemberValidator = [
    // name is optional on PATCH — only validate when provided
    check('name')
      .optional({ checkFalsy: true })
      .notEmpty()
      .withMessage('name cannot be empty if provided.'),
    check("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Email must be a valid email address."),
    validate
  ]