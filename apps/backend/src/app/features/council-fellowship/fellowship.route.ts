import express from "express";

import * as RoleController from "./controllers/fellowship.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import { createFellowshipValidator } from "./validators/create-fellowship.validator";
import { editFellowshipValidator } from "./validators/edit-fellowship.validator";
import { multerConfig, RESOURCES, DESTINANTIONS, FILTERS } from "../../config/multer.config";

const upload = multerConfig(
  RESOURCES.FILE,
  DESTINANTIONS.FILE.FILE,
  FILTERS.FILE
);

const router = express.Router();

router
  .route("/")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.CouncilFellowship.COUNCIL_FELLOWSHIP_ADD),
    upload.array("files"),
    createFellowshipValidator,
    RoleController.createFellowship
  );

router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.CouncilFellowship.COUNCIL_FELLOWSHIP_VIEW),
    RoleController.getFellowship
  )
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.CouncilFellowship.COUNCIL_FELLOWSHIP_CHANGE),
    upload.array("files"),
    editFellowshipValidator,
    RoleController.updateFellowship
  );


// Toggle fellowship board member active/inactive status
router.patch(
  '/:fellowshipId/board-members/:boardMemberId/toggle-status',
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.CouncilFellowship.COUNCIL_FELLOWSHIP_CHANGE),
  RoleController.toggleFellowshipBoardMemberStatus
);

export default router;
