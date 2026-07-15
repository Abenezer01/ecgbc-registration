-- CreateTable
CREATE TABLE `DataLookup` (
    `id` VARCHAR(191) NOT NULL,
    `index` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `note` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DataLookup_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `codeName` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_codeName_key`(`codeName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `stateId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `passwordResetToken` VARCHAR(191) NULL,
    `passwordResetExpiresIn` DATETIME(3) NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `stateId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Staff_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouncilFellowship` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `certificateNo` VARCHAR(191) NOT NULL,
    `certificateIssuedDate` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isInEthiopia` BOOLEAN NOT NULL,
    `country` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `subcity` VARCHAR(191) NULL,
    `zone` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `houseNumber` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `poBoxNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CouncilFellowship_name_key`(`name`),
    UNIQUE INDEX `CouncilFellowship_certificateNo_key`(`certificateNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `certificateNo` VARCHAR(191) NOT NULL,
    `certificateIssuedDate` DATETIME(3) NOT NULL,
    `isInEthiopia` BOOLEAN NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `subcity` VARCHAR(191) NULL,
    `zone` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `houseNumber` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `poBoxNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `councilFellowshipId` VARCHAR(191) NOT NULL,
    `typeId` VARCHAR(191) NOT NULL,
    `stateId` VARCHAR(191) NOT NULL,
    `regionId` VARCHAR(191) NULL,
    `reasonForInactive` TEXT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Member_name_key`(`name`),
    UNIQUE INDEX `Member_certificateNo_key`(`certificateNo`),
    INDEX `Member_councilFellowshipId_idx`(`councilFellowshipId`),
    INDEX `Member_typeId_idx`(`typeId`),
    INDEX `Member_stateId_idx`(`stateId`),
    INDEX `Member_regionId_idx`(`regionId`),
    INDEX `Member_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BoardMember` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `councilFellowshipId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `crv` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `statusId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `councilFellowshipId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Report_memberId_year_key`(`memberId`, `year`),
    UNIQUE INDEX `Report_councilFellowshipId_year_key`(`councilFellowshipId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `File` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `memberId` VARCHAR(191) NULL,
    `councilFellowshipId` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_PermissionToRole` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_PermissionToRole_AB_unique`(`A`, `B`),
    INDEX `_PermissionToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Staff` ADD CONSTRAINT `Staff_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `DataLookup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMember` ADD CONSTRAINT `BoardMember_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BoardMember` ADD CONSTRAINT `BoardMember_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `DataLookup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_councilFellowshipId_fkey` FOREIGN KEY (`councilFellowshipId`) REFERENCES `CouncilFellowship`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PermissionToRole` ADD CONSTRAINT `_PermissionToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
