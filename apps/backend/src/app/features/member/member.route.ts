import express from "express";

import * as MemberController from "./controllers/member.controller"; // Keep this one
import * as FileController from "../file/controllers/file.controller";
import * as MembersFilter from "./filters/member.filter";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import * as Permissions from "../permission/enums/permission.enum";
import { createMemberValidator } from "./validators/create-member.validator";
import { editMemberValidator } from "./validators/edit-member.validator";
import { inactiveMemberValidator } from "./validators/inactive-member.validator";
import { seedMembers } from "../../../seeders/members/selam/create.seeder";


const router = express.Router();

// Add the new routes for soft delete functionality
// Route to mark a member as inactive (soft delete)
router.patch('/:id/inactive', 
  // StaffAuthMiddleware.verifyStaff,
  // StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  inactiveMemberValidator,
  MemberController.softDeleteMember
);

router.get(
  "/inactive/all",
  StaffAuthMiddleware.verifyStaff,
  // StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  MemberController.getAllInactiveMembers
);

// Route to restore a member to active
router.patch('/:id/restore', 
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  MemberController.restoreMember
);

// Route to restore deleted member to inactive
router.patch(
  "/:id/restore-inactive",
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  MemberController.restoreDeletedToInactive
);

// Route to get inactive count (RBAC-aware)
router.get(
  "/inactive/count",
  StaffAuthMiddleware.verifyStaff,
  // Require deactivate permission for count as well
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  MemberController.getInactiveCount
);

router.get('/inactive/list', 
  StaffAuthMiddleware.verifyStaff,
  // Require deactivate permission for list
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE),
  MemberController.getInactiveMembers // Use MemberController here
);

// Route to get deleted members count (admin only essentially, but controller handles it) 
router.get(
  "/deleted/count",
  StaffAuthMiddleware.verifyStaff,
  // StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE), // Optional restrict
  MemberController.getDeletedCount
);

// Route to get deleted members list
router.get(
  "/deleted/list",
  StaffAuthMiddleware.verifyStaff,
  MemberController.getDeletedMembers
);

// Route to permanently delete (move to trash)
router.patch(
  "/:id/delete",
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE), // Using deactivate perm for now
  MemberController.permanentlyDeleteMember
);

// Route to HARD DELETE (remove from db)
router.delete(
  "/:id/hard",
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_DEACTIVATE), // Using deactivate perm
  MemberController.hardDeleteMember
);

router
  .route("/")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    MembersFilter.getMembers,
    MemberController.getMembers
  )
  .put(async (req, res, next) => {
    const members = await seedMembers();
    res.json({
      status: "success",
      data: members,
    });
  })
  .post(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_ADD),
    FileController.uploadMemberFiles.pre,
       FileController.uploadMemberFiles.post,
    createMemberValidator,
    MemberController.createMember
  );

router
  .route("/:id")
  .get(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_VIEW),
    MemberController.getMember
  )
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_CHANGE
    ),
    editMemberValidator,
    MemberController.updateMember
  );

router
  .route("/:id/active")
  .patch(
    StaffAuthMiddleware.verifyStaff,
    StaffAuthMiddleware.restrictStaff(
      Permissions.MemberPermission.MEMBER_DEACTIVATE
    ),
    MemberController.activeMember
  );

router.get('/check-certificate/:certificateNo', 
  StaffAuthMiddleware.verifyStaff,
  StaffAuthMiddleware.restrictStaff(Permissions.MemberPermission.MEMBER_ADD),
  MemberController.checkCertificateNumber
);

export default router;
