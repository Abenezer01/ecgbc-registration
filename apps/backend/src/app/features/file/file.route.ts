import express from "express";

import * as FileController from "./controllers/file.controller";
import * as FilesFilter from "./filters/file.filter";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import { createMemberFileValidator } from "./validators/create-file.validator";
// import { editMemberValidator } from "./validators/edit-report.validator";

const router = express.Router();

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    FilesFilter.getFiles,
    FileController.getFiles
  );
router
  .route("/member")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    FileController.uploadFile.pre,
    FileController.uploadFile.post,
    createMemberFileValidator,
    FileController.createMemberFile
  );
  router
  .route("/member/bulk-upload")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    FileController.uploadMemberFiles.pre,
    FileController.uploadMemberFiles.post,
    createMemberFileValidator,
    FileController.bulkUploadMemberFiles
  );
  router
  .route("/fellowship/bulk-upload")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ), // Reuse CHANGE permission or define FELLOWSHIP_CHANGE
    FileController.uploadFellowshipFiles.pre,
    FileController.uploadFellowshipFiles.post,
    FileController.bulkUploadFellowshipFiles
  );
router
  .route("/fellowship")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    FileController.uploadFile.pre,
    FileController.uploadFile.post,
    FileController.createFellowshipFile
  );
router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    FileController.getFile
  )
  .delete(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_DELETE
    ),
    FileController.deleteFile
  );

export default router;
