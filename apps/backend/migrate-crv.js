const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE `Report` CHANGE `crv` `bankReference` VARCHAR(191) NULL;');
  console.log('Renamed Report.crv -> Report.bankReference');
  await prisma.$executeRawUnsafe('ALTER TABLE `ReportingFee` ADD COLUMN IF NOT EXISTS `crv` VARCHAR(191) NULL;');
  console.log('Added ReportingFee.crv');
}
main().catch(console.error).finally(() => prisma.$disconnect());
