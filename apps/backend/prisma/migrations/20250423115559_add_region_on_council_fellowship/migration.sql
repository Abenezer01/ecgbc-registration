/*
  Warnings:
y
  - You are about to drop the column `region` on the `councilfellowship` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `councilfellowship` DROP COLUMN `region`,
    ADD COLUMN `regionId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `member` MODIFY `reasonForInactive` TEXT NULL;

-- AddForeignKey
ALTER TABLE `CouncilFellowship` ADD CONSTRAINT `CouncilFellowship_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
