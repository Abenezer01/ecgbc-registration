/*
  Warnings:

  - You are about to drop the column `created_at` on the `BoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `BoardMember` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `DataLookup` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `DataLookup` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the `_PermissionToRole` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `councilFellowshipId` on table `BoardMember` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileName` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isFromSelamMinster` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `councilFellowshipId` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `BoardMember` DROP FOREIGN KEY `BoardMember_councilFellowshipId_fkey`;

-- DropForeignKey
ALTER TABLE `Member` DROP FOREIGN KEY `Member_stateId_fkey`;

-- DropForeignKey
ALTER TABLE `Member` DROP FOREIGN KEY `Member_typeId_fkey`;

-- DropForeignKey
ALTER TABLE `Report` DROP FOREIGN KEY `Report_councilFellowshipId_fkey`;

-- DropForeignKey
ALTER TABLE `Report` DROP FOREIGN KEY `Report_statusId_fkey`;

-- DropForeignKey
ALTER TABLE `Role` DROP FOREIGN KEY `Role_stateId_fkey`;

-- DropForeignKey
ALTER TABLE `Role` DROP FOREIGN KEY `Role_typeId_fkey`;

-- DropForeignKey
ALTER TABLE `_PermissionToRole` DROP FOREIGN KEY `_PermissionToRole_A_fkey`;

-- DropForeignKey
ALTER TABLE `_PermissionToRole` DROP FOREIGN KEY `_PermissionToRole_B_fkey`;

-- DropIndex
DROP INDEX `Member_certificateNo_key` ON `Member`;

-- DropIndex
DROP INDEX `Member_city_idx` ON `Member`;

-- DropIndex
DROP INDEX `Member_name_key` ON `Member`;

-- DropIndex
DROP INDEX `Member_typeChangedAt_idx` ON `Member`;

-- DropIndex
DROP INDEX `Report_councilFellowshipId_year_key` ON `Report`;

-- DropIndex
DROP INDEX `Report_memberId_year_key` ON `Report`;

-- AlterTable
ALTER TABLE `BoardMember` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    MODIFY `councilFellowshipId` VARCHAR(191) NOT NULL,
    MODIFY `fullName` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `DataLookup` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    MODIFY `index` INTEGER NULL,
    MODIFY `type` VARCHAR(191) NULL,
    MODIFY `category` VARCHAR(191) NULL,
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `isDefault` BOOLEAN NULL,
    MODIFY `note` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `File` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `fileName` VARCHAR(191) NOT NULL,
    MODIFY `isFromSelamMinster` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Member` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `memberCategoryId` VARCHAR(191) NULL,
    MODIFY `certificateNo` VARCHAR(191) NULL,
    MODIFY `certificateIssuedDate` DATETIME(3) NULL,
    MODIFY `isInEthiopia` BOOLEAN NULL,
    MODIFY `country` VARCHAR(191) NULL,
    MODIFY `typeId` VARCHAR(191) NULL,
    MODIFY `stateId` VARCHAR(191) NULL,
    MODIFY `reasonForInactive` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Permission` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Report` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `title` VARCHAR(191) NULL,
    MODIFY `year` INTEGER NULL,
    MODIFY `reportedAt` DATETIME(3) NULL,
    MODIFY `statusId` VARCHAR(191) NULL,
    MODIFY `councilFellowshipId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Role` DROP COLUMN `created_at`,
    DROP COLUMN `updated_at`,
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `typeId` VARCHAR(191) NULL,
    MODIFY `stateId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `_PermissionToRole`;

-- CreateTable
CREATE TABLE `StaffFellowship` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `fellowshipId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StaffFellowship_staffId_fellowshipId_key`(`staffId`, `fellowshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RolePermissions` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_RolePermissions_AB_unique`(`A`, `B`),
    INDEX `_RolePermissions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMember` ADD CONSTRAINT `BoardMember_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffFellowship` ADD CONSTRAINT `StaffFellowship_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffFellowship` ADD CONSTRAINT `StaffFellowship_fellowshipId_fkey` FOREIGN KEY (`fellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
