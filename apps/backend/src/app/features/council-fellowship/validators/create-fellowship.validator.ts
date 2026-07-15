import { check } from "express-validator";
import { validate } from "../../../shared/middlewares/validate.middleware";

export const createFellowshipValidator = [
  check("name").not().isEmpty().withMessage("name is required."),
  check("region").not().isEmpty().withMessage("region is required."),
  check("certificateNo")
    .not()
    .isEmpty()
    .withMessage("certificateNo is required."),
  check("certificateIssuedDate")
    .not()
    .isEmpty()
    .withMessage("certificateIssuedDate is required."),
  check("isInEthiopia").isBoolean().withMessage("isInEthiopia is required."),
  validate,
];
