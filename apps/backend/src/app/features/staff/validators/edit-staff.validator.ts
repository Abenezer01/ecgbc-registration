import { body } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editStaffValidator = [
    body("firstName", "firstName is required").optional().not().isEmpty(),
    body("lastName", "lastName is required").optional().not().isEmpty(),
    body('email').optional().isEmail().trim().escape().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('roleId').optional().isUUID().withMessage('roleId must be UUID'),
   
    validate
  ]