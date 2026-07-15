import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editMemberValidator = [
    check('name').not().isEmpty().withMessage('name is required.'),
    check("email").optional({ checkFalsy: true }).isEmail().withMessage("Email must be a valid email address."),
    validate
  ]