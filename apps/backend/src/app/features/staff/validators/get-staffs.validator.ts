import { query } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";
import validateAbstractQuery from "../../../shared/validators/query.validator";

export const getStaffsQueryValidator = [
    ...validateAbstractQuery,
    query('state').optional().isUUID().withMessage('state must be UUID'),
    validate
]