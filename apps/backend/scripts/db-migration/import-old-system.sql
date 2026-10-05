-- Replaces the live data (ecgbc_db) with the old system's data, which must already be
-- loaded into the ecgbc_staging database (run-import.sh does that). Run it against ecgbc_db.
--
--   Old system (source of truth) : members, fellowships, board members, files, reports,
--                                  staff, staff-fellowship links
--   Kept from the VPS (config)   : new lookups, permissions, role-permission links,
--                                  payment methods, fee rules, migrations history
--   Removed (VPS test data)      : activity, action states, name reservations, registration
--                                  requests, church users, contact persons, lineage,
--                                  closures, transfers, reporting fees, report requests
--
-- Everything runs in one transaction: if any statement fails, the mysql client stops
-- and nothing is committed.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. Remove test data created on the VPS
-- ---------------------------------------------------------------------------
DELETE FROM activity;
DELETE FROM actionstate;
DELETE FROM namereservation;
DELETE FROM registrationrequest;
DELETE FROM churchuser;
DELETE FROM contactperson;
DELETE FROM memberlineage;
DELETE FROM memberclosurerequest;
DELETE FROM membertransfer;
DELETE FROM reportingfee;
DELETE FROM reportrequest;

-- ---------------------------------------------------------------------------
-- 2. Records: replaced entirely by the old system
-- ---------------------------------------------------------------------------
DELETE FROM stafffellowship;
DELETE FROM boardmember;
DELETE FROM file;
DELETE FROM report;
DELETE FROM member;
DELETE FROM councilfellowship;
DELETE FROM staff;

INSERT INTO councilfellowship
  (`id`, `name`, `certificateNo`, `certificateIssuedDate`, `description`, `isInEthiopia`, `country`, `regionId`, `city`, `subcity`, `zone`, `district`, `houseNumber`, `phoneNumber`, `poBoxNumber`, `email`, `created_at`, `updated_at`)
SELECT
   `id`, `name`, `certificateNo`, `certificateIssuedDate`, `description`, `isInEthiopia`, `country`, `regionId`, `city`, `subcity`, `zone`, `district`, `houseNumber`, `phoneNumber`, `poBoxNumber`, `email`, `created_at`, `updated_at`
FROM ecgbc_staging.councilfellowship;

-- isActive is optional in the old schema and required now (default true)
INSERT INTO member
  (`id`, `name`, `certificateNo`, `certificateIssuedDate`, `isInEthiopia`, `country`, `city`, `subcity`, `zone`, `district`, `houseNumber`, `phoneNumber`, `poBoxNumber`, `email`, `councilFellowshipId`, `typeId`, `stateId`, `regionId`, `reasonForInactive`, `previousTypeId`, `typeChangedAt`, `created_at`, `updated_at`, `isActive`, `memberCategoryId`)
SELECT
   `id`, `name`, `certificateNo`, `certificateIssuedDate`, `isInEthiopia`, `country`, `city`, `subcity`, `zone`, `district`, `houseNumber`, `phoneNumber`, `poBoxNumber`, `email`, `councilFellowshipId`, `typeId`, `stateId`, `regionId`, `reasonForInactive`, `previousTypeId`, `typeChangedAt`, `created_at`, `updated_at`, COALESCE(`isActive`, 1), `memberCategoryId`
FROM ecgbc_staging.member;

INSERT INTO boardmember
  (`id`, `memberId`, `councilFellowshipId`, `fullName`, `phoneNumber`, `created_at`, `updated_at`)
SELECT
   `id`, `memberId`, `councilFellowshipId`, `fullName`, `phoneNumber`, `created_at`, `updated_at`
FROM ecgbc_staging.boardmember;

INSERT INTO file
  (`id`, `fileName`, `file`, `memberId`, `councilFellowshipId`, `isFromSelamMinster`, `created_at`, `updated_at`)
SELECT
   `id`, `fileName`, `file`, `memberId`, `councilFellowshipId`, `isFromSelamMinster`, `created_at`, `updated_at`
FROM ecgbc_staging.file;

-- Names too long for Linux (over 255 bytes; garbled Amharic takes 6 bytes per letter) or cut
-- off by the 191-character column were uploaded as file-<MD5 of the first 191 characters>.<ext>
-- by upload-files-to-vps.ps1. Point the rows at those files. A cut-off name (191 characters)
-- lost its extension; all of them are PDFs.
UPDATE file
SET `file` = CONCAT('file-', MD5(`file`),
                    IF(CHAR_LENGTH(`file`) < 191 AND `file` REGEXP '[.][A-Za-z0-9]{1,5}$',
                       CONCAT('.', SUBSTRING_INDEX(`file`, '.', -1)), '.pdf'))
WHERE LENGTH(`file`) > 255 OR CHAR_LENGTH(`file`) >= 191;

-- The old system's `crv` holds the church's bank reference; in the current schema that
-- is `bankReference` (see migrate-crv.js), and `crv` is the finance receipt number.
INSERT INTO report
  (`id`, `year`, `reportedAt`, `bankReference`, `file`, `remark`, `statusId`, `memberId`, `councilFellowshipId`, `created_at`, `updated_at`)
SELECT
   `id`, `year`, `reportedAt`, NULLIF(`crv`, ''), `file`, `remark`, `statusId`, `memberId`, `councilFellowshipId`, `created_at`, `updated_at`
FROM ecgbc_staging.report;

INSERT INTO staff
  (`id`, `email`, `fullName`, `firstName`, `lastName`, `phoneNumber`, `password`, `avatar`, `passwordResetToken`, `passwordResetExpiresIn`, `roleId`, `stateId`, `created_at`, `updated_at`)
SELECT
   `id`, `email`, `fullName`, `firstName`, `lastName`, `phoneNumber`, `password`, `avatar`, `passwordResetToken`, `passwordResetExpiresIn`, `roleId`, `stateId`, `created_at`, `updated_at`
FROM ecgbc_staging.staff;

INSERT INTO stafffellowship
  (`id`, `staffId`, `fellowshipId`)
SELECT
   `id`, `staffId`, `fellowshipId`
FROM ecgbc_staging.stafffellowship;

-- ---------------------------------------------------------------------------
-- 3. Configuration: the old system's values win for shared rows,
--    rows that exist only on the VPS (used by the new features) are kept
-- ---------------------------------------------------------------------------
INSERT INTO datalookup
  (`id`, `index`, `type`, `category`, `description`, `isDefault`, `value`, `note`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT `id`, `index`, `type`, `category`, `description`, `isDefault`, `value`, `note`, `created_at`, `updated_at`
  FROM ecgbc_staging.datalookup
) AS s
ON DUPLICATE KEY UPDATE
  `index` = s.`index`, `type` = s.`type`, `category` = s.`category`, `description` = s.`description`,
  `isDefault` = s.`isDefault`, `value` = s.`value`, `note` = s.`note`, `updated_at` = s.`updated_at`;

INSERT INTO role
  (`id`, `name`, `description`, `typeId`, `stateId`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT `id`, `name`, `description`, `typeId`, `stateId`, `created_at`, `updated_at`
  FROM ecgbc_staging.role
) AS s
ON DUPLICATE KEY UPDATE
  `name` = s.`name`, `description` = s.`description`, `typeId` = s.`typeId`, `stateId` = s.`stateId`, `updated_at` = s.`updated_at`;

INSERT INTO permission
  (`id`, `codeName`, `description`, `created_at`, `updated_at`)
SELECT * FROM (
  SELECT `id`, `codeName`, `description`, `created_at`, `updated_at`
  FROM ecgbc_staging.permission
) AS s
ON DUPLICATE KEY UPDATE
  `codeName` = s.`codeName`, `description` = s.`description`, `updated_at` = s.`updated_at`;

-- Union: the old system's role assignments plus the VPS assignments for new permissions
INSERT IGNORE INTO _permissiontorole (`A`, `B`)
SELECT `A`, `B` FROM ecgbc_staging._permissiontorole;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
