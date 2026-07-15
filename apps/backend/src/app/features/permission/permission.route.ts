import express from "express";

import * as PermissionController from "./controllers/permission.controller";
import * as AuthMiddleware from "../auth/middlewares/auth.middleware";
import * as PermissionFilter from "./filters/permission.filter";
import * as Permissions from "./enums/permission.enum";
import { getPermissionsQueryValidator } from "./validators/get-permission-query.validator";

const router = express.Router();

router
  .route("/")
  .get(
    AuthMiddleware.verifyStaff,
    AuthMiddleware.restrictStaff(
      Permissions.PermissionPermission.PERMISSION_VIEW
    ),
    PermissionController.getPermissions
  );

export default router;
