import express from "express";

import * as RoleController from "./controllers/role.controller";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import { getRolesQueryValidator } from "./validators/get-roles.validator";
import { createRoleValidator } from "./validators/create-role.validator";
import { editRoleValidator } from "./validators/edit-role.validatory";

const router = express.Router();

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    getRolesQueryValidator,
    StaffAuthMiddleware.restrictStaff(Permissions.RolePermission.ROLE_VIEW),
    RoleController.getRoles
  )
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.RolePermission.ROLE_ADD),
    createRoleValidator,
    RoleController.createRole
  );

router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.RolePermission.ROLE_VIEW),
    RoleController.getRole
  )
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.RolePermission.ROLE_CHANGE),
    editRoleValidator,
    RoleController.updateRole
  );


export default router;
