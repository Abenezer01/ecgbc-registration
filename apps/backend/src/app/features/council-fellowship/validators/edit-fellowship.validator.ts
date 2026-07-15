import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editFellowshipValidator = [
    // check('name').not().isEmpty().withMessage('name is required.'),
    // check('description').not().isEmpty().withMessage('description is required.'),
    validate
  ]