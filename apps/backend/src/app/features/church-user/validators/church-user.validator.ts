import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Validation rules for creating church user
 */
export const createChurchUserValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Invalid phone number format"),
  
  body("role")
    .optional()
    .isIn(["ADMIN", "EDITOR", "VIEWER"])
    .withMessage("Role must be one of: ADMIN, EDITOR, VIEWER"),
  
  body("memberId")
    .notEmpty()
    .withMessage("Member ID is required")
    .isUUID()
    .withMessage("Invalid Member ID format"),
];

/**
 * Validation rules for updating church user
 */
export const updateChurchUserValidator = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  
  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Invalid phone number format"),
  
  body("role")
    .optional()
    .isIn(["ADMIN", "EDITOR", "VIEWER"])
    .withMessage("Role must be one of: ADMIN, EDITOR, VIEWER"),
];

/**
 * Validation rules for password reset (admin)
 */
export const adminResetPasswordValidator = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.type === "field" ? (error as any).path : "unknown",
        message: error.msg,
      })),
    });
    return;
  }
  next();
};
