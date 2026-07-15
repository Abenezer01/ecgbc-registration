import express from "express";

import * as ReportController from "./controllers/report.controller";
import * as ReportFilter from "./filters/report.filter";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import {
  createMemberReportValidator,
  createFellowshipReportValidator,
} from "./validators/create-report.validator";
import { updateMemberReportValidator } from "./validators/update-report.validator";
// import { editMemberValidator } from "./validators/edit-report.validator";

const router = express.Router();

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    ReportFilter.getReports,
    ReportController.getReports
  );
router
  .route("/member")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    ReportController.uploadReport.pre,
    ReportController.uploadReport.post,
    createMemberReportValidator,
    ReportController.createMemberReport
  )
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    ReportController.uploadReport.pre,
    ReportController.uploadReport.post,
    updateMemberReportValidator,
    ReportController.updateMemberReport
  );
  router
  .route("/member/:id")
  .delete(StaffAuthMiddleware.verifyStaff, StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DELETE),ReportController.deleteReport)
  ;
router
  .route("/fellowship")
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    ReportController.uploadReport.pre,
    ReportController.uploadReport.post,
    createFellowshipReportValidator,
    ReportController.createFellowshipReport
  );
router
  .route("/fellowship/:id")
  .delete(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DELETE),
    ReportController.deleteReport
  );
router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    ReportController.getReport
  )
  .delete(StaffAuthMiddleware.verifyStaff, StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DELETE),ReportController.deleteReport)
  ;

export default router;
