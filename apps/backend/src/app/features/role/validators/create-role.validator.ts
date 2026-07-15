import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const createRoleValidator = [
    check('name').not().isEmpty().withMessage('name is required.'),
    check('description').not().isEmpty().withMessage('description is required.'),
    check('permissions')
    .isArray().withMessage('The field must be an array.')
    .custom((value) => {
      if(value.length>0){
        const isValid = value.every((id: string) => {
          
          return typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        });
        if (!isValid) {
          throw new Error('permissions must be an array of valid UUIDs.');
        }
        return true;
      }else{
        throw new Error('permissions must be an array of valid UUIDs.');
      }
     
    }),
    validate
  ]