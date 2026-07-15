import 'dotenv/config';
import prisma from '../app/config/db.config';

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: tsx src/scripts/count-fellowship-members.ts <certificateNo or fellowshipId or memberCertificateNo>');
    process.exit(1);
  }

  // Try council fellowship by certificateNo or id first
  let fellowship = await prisma.councilFellowship.findFirst({
    where: { OR: [ { certificateNo: arg }, { id: arg } ] },
    select: { id: true, name: true, certificateNo: true },
  });

  // If not found, try resolving via a member certificateNo
  if (!fellowship) {
    const member = await prisma.member.findUnique({ where: { certificateNo: arg }, select: { councilFellowshipId: true } });
    if (member?.councilFellowshipId) {
      fellowship = await prisma.councilFellowship.findUnique({
        where: { id: member.councilFellowshipId },
        select: { id: true, name: true, certificateNo: true },
      });
    }
  }

  if (!fellowship) {
    console.error('Fellowship not found for identifier:', arg);
    process.exit(1);
  }

  const [
    totalChurches, totalMinistries,
    activeChurches, activeMinistries,
    inactiveChurches, inactiveMinistries
  ] = await Promise.all([
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'CHURCH' } } }),
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'MINISTRY' } } }),
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'CHURCH' }, isActive: true } }),
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'MINISTRY' }, isActive: true } }),
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'CHURCH' }, isActive: false } }),
    prisma.member.count({ where: { councilFellowshipId: fellowship.id, type: { value: 'MINISTRY' }, isActive: false } }),
  ]);

  console.log('Fellowship:', fellowship.certificateNo, fellowship.name);
  console.log('Total Churches:', totalChurches, '| Active:', activeChurches, '| Inactive:', inactiveChurches);
  console.log('Total Ministries:', totalMinistries, '| Active:', activeMinistries, '| Inactive:', inactiveMinistries);
}

main().finally(() => prisma.$disconnect());
