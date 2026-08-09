import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const createFellowshipValidator = [
  check("name").not().isEmpty().withMessage("name is required."),
  check("region").not().isEmpty().withMessage("region is required."),
  check("certificateNo")
    .not()
    .isEmpty()
    .withMessage("certificateNo is required."),
  check("certificateIssuedDate")
    .not()
    .isEmpty()
    .withMessage("certificateIssuedDate is required."),
  check("isInEthiopia").isBoolean().withMessage("isInEthiopia is required."),
  
  // Contact Person Validation (Optional)
  check("contactPersonFullName").optional().notEmpty().withMessage("Contact person full name is required if provided."),
  check("contactPersonPhoneNumber").optional().notEmpty().withMessage("Contact person phone number is required if provided."),
  check("contactPersonEmail").optional().isEmail().withMessage("Invalid contact person email."),
  
  validate,
];
