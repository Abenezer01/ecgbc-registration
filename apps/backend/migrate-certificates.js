const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCertificateNumbers() {
  console.log('Starting certificate number migration...');

  // Migrate member certificate numbers
  const members = await prisma.member.findMany({
    select: { id: true, certificateNo: true }
  });

  let memberUpdated = 0;
  for (const member of members) {
    if (member.certificateNo && member.certificateNo.length < 5 && !member.certificateNo.startsWith('0')) {
      const padded = member.certificateNo.padStart(5, '0');
      
      // Check if the padded version already exists
      const existingPadded = await prisma.member.findUnique({
        where: { certificateNo: padded },
        select: { id: true }
      });
      
      if (!existingPadded) {
        await prisma.member.update({
          where: { id: member.id },
          data: { certificateNo: padded }
        });
        memberUpdated++;
        if (memberUpdated % 100 === 0) {
          console.log(`Updated ${memberUpdated} members...`);
        }
      } else {
        console.log(`Skipping ${member.certificateNo} -> ${padded} (already exists)`);
      }
    }
  }
  console.log(`Migration complete. Updated ${memberUpdated} member certificate numbers.`);

  // Migrate fellowship certificate numbers
  const fellowships = await prisma.councilFellowship.findMany({
    select: { id: true, certificateNo: true }
  });

  let fellowshipUpdated = 0;
  for (const fellowship of fellowships) {
    if (fellowship.certificateNo && fellowship.certificateNo.length < 5 && !fellowship.certificateNo.startsWith('0')) {
      const padded = fellowship.certificateNo.padStart(5, '0');
      
      // Check if the padded version already exists
      const existingPadded = await prisma.councilFellowship.findUnique({
        where: { certificateNo: padded },
        select: { id: true }
      });
      
      if (!existingPadded) {
        await prisma.councilFellowship.update({
          where: { id: fellowship.id },
          data: { certificateNo: padded }
        });
        fellowshipUpdated++;
      }
    }
  }
  console.log(`Updated ${fellowshipUpdated} fellowship certificate numbers.`);

  await prisma.$disconnect();
}

migrateCertificateNumbers().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
