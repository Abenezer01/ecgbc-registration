import express from "express";

import * as FellowshipListController from "./controllers/fellowship-list.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";

const router = express.Router();

router.get(
  "/",
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.CouncilFellowship.COUNCIL_FELLOWSHIP_VIEW),
  FellowshipListController.getFellowshipList
);

export default router;
