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
    
    // Contact Person Validation
    check("contactPersonFullName").optional({ checkFalsy: true }).notEmpty().withMessage("Contact person full name is required if provided."),
    check("contactPersonPhoneNumber").optional({ checkFalsy: true }).notEmpty().withMessage("Contact person phone number is required if provided."),
    check("contactPersonEmail").optional({ checkFalsy: true }).isEmail().withMessage("Invalid contact person email."),
    
    validate
  ]