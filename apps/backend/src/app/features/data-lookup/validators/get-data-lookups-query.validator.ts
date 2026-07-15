import { query } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const getDataLookupsQueryValidator = [
    query('type').optional().isString().notEmpty().withMessage('Type is required'),
    query('category').optional().isString().notEmpty().withMessage('Category is required'),
    validate
]