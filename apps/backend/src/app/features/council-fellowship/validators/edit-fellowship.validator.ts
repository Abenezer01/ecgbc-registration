import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editFellowshipValidator = [
    // check('name').not().isEmpty().withMessage('name is required.'),
    // check('description').not().isEmpty().withMessage('description is required.'),
    
    // Contact Person Validation
    check("contactPersonFullName").optional({ checkFalsy: true }).notEmpty().withMessage("Contact person full name is required if provided."),
    check("contactPersonPhoneNumber").optional({ checkFalsy: true }).notEmpty().withMessage("Contact person phone number is required if provided."),
    check("contactPersonEmail").optional({ checkFalsy: true }).isEmail().withMessage("Invalid contact person email."),
    
    validate
  ]