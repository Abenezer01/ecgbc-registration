/*
  Warnings:

  - You are about to drop the `file` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `file` DROP FOREIGN KEY `File_councilFellowshipId_fkey`;

-- DropForeignKey
ALTER TABLE `file` DROP FOREIGN KEY `File_memberId_fkey`;

-- AlterTable
ALTER TABLE `Member` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE `file`;

-- CreateTable
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `memberId` VARCHAR(191) NULL,
    `councilFellowshipId` VARCHAR(191) NULL,
    `isFromSelamMinster` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
