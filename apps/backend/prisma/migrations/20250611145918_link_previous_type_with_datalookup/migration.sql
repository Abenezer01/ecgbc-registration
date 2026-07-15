-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_previousTypeId_fkey` FOREIGN KEY (`previousTypeId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
