-- AlterTable
ALTER TABLE `member` ADD COLUMN `previousTypeId` VARCHAR(191) NULL,
    ADD COLUMN `typeChangedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Member_typeChangedAt_idx` ON `Member`(`typeChangedAt`);
