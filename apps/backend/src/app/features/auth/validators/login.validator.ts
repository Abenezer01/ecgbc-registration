import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const loginValidator =   [
    check('email').isEmail().withMessage('Please enter a valid email address.'),
    check('password').isLength({ min: 8 }).withMessage('Password must be 8 characters long'),
    validate,
  ]