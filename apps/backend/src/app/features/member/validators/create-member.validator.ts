import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";
// name,location,certificateNo,certificateIssuedDate,isInEthiopia,councilFellowshipId,memberCategoryId,typeId,stateId
export const createMemberValidator = [
  check("name").not().isEmpty().withMessage("name is required."),
  // check('regionId').optional().not().isEmpty().withMessage('regionId is required.'),
  check("certificateNo")
    .not()
    .isEmpty()
    .withMessage("certificateNo is required."),
  check("certificateIssuedDate")
    .not()
    .isEmpty()
    .withMessage("certificateIssuedDate is required."),
  check("councilFellowshipId")
    .not()
    .isEmpty()
    .withMessage("councilFellowshipId is required."),
  check("typeId").not().isEmpty().withMessage("typeId is required."),
  // check('stateId').not().isEmpty().withMessage('stateId is required.'),
  check("isInEthiopia").isBoolean().withMessage("isInEthiopia is required."),
  validate,
];
