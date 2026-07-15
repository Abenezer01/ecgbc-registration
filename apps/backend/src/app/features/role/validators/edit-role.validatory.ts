import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const editRoleValidator = [
    check('name').optional().isString().withMessage('name should be a string'),
    check('description').optional().isString().withMessage('description should be a string'),
    check('permissions')
    .optional()
    .isArray().withMessage('The field must be an array.')
    .custom((value) => {
      const isValid = value.every((id: string) => {
        return typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      });
      if (!isValid) {
        throw new Error('permissions must be an array of valid UUIDs.');
      }
      return true;
    }),
    validate
  ]