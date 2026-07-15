import express, { NextFunction, Request,Response } from "express";

import * as StaffController from "./controllers/staff.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import { createStaffValidator } from "./validators/create-staff.validator";
import { getStaffsQueryValidator } from "./validators/get-staffs.validator";
import { editStaffValidator } from "./validators/edit-staff.validator";

const router = express.Router();

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    getStaffsQueryValidator,
    StaffAuthMiddleware.restrictStaff(Permissions.StaffPermission.STAFF_VIEW),
    StaffController.getStaffs
  )
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.StaffPermission.STAFF_ADD),
    StaffController.uploadImage.pre,
    StaffController.uploadImage.post,
    createStaffValidator,
    StaffController.createStaff
  );

router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.StaffPermission.STAFF_VIEW),
    StaffController.getStaff
  )
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.StaffPermission.STAFF_CHANGE),
    StaffController.uploadImage.pre,
    StaffController.uploadImage.post,
    editStaffValidator,
    StaffController.updateStaff
  );

  router
  .route("/update/:id")
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictToOwner,
    StaffController.uploadImage.pre,
    StaffController.uploadImage.post,
    editStaffValidator,
    StaffController.updateStaff
  );


export default router;
