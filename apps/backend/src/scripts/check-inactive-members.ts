import 'dotenv/config';
import prisma from '../app/config/db.config';
import { CommonObjectState } from '../app/features/data-lookup/enums/data-lookup.enum';

async function main() {
  const [inactiveByFlag, inactiveByState, combinedInactive] = await Promise.all([
    prisma.member.count({ where: { isActive: false } }),
    prisma.member.count({ where: { state: { value: CommonObjectState.IN_ACTIVE } } }),
    prisma.member.count({
      where: {
        OR: [
          { isActive: false },
          { state: { value: CommonObjectState.IN_ACTIVE } },
        ],
      },
    }),
  ]);

  const activeButStateInactive = await prisma.member.findMany({
    where: {
      isActive: true,
      state: { value: CommonObjectState.IN_ACTIVE },
    },
    select: {
      id: true,
      name: true,
      certificateNo: true,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  const inactiveButStateActive = await prisma.member.findMany({
    where: {
      isActive: false,
      state: { value: CommonObjectState.ACTIVE },
    },
    select: {
      id: true,
      name: true,
      certificateNo: true,
      isActive: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log('Inactive members metrics:');
  console.log(' - isActive = false:', inactiveByFlag);
  console.log(' - state = IN_ACTIVE:', inactiveByState);
  console.log(' - union of both conditions:', combinedInactive);

  if (activeButStateInactive.length > 0) {
    console.log(`\nMembers with isActive=true but state=IN_ACTIVE (${activeButStateInactive.length}):`);
    for (const m of activeButStateInactive) {
      console.log(`  - ${m.certificateNo} | ${m.name}`);
    }
  }

  if (inactiveButStateActive.length > 0) {
    console.log(`\nMembers with isActive=false but state=ACTIVE (${inactiveButStateActive.length}):`);
    for (const m of inactiveButStateActive) {
      console.log(`  - ${m.certificateNo} | ${m.name}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Error while checking inactive member metrics:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
