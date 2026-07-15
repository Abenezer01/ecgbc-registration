import { query } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const getPermissionsQueryValidator = [
    // query('term').isString().isLength({ min: 1 }).withMessage('Search term must be at least 3 characters long'),
    validate
]