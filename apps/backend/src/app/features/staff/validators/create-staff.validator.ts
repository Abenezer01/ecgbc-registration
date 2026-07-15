import { body, check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const createStaffValidator = [
    body("firstName", "firstName is required").not().isEmpty(),
    body("lastName", "lastName is required").not().isEmpty(),
    body('email').isEmail().trim().escape().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('roleId').isUUID().withMessage('roleId must be UUID'),
   
    validate
  ]