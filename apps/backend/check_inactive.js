const { PrismaClient } = require('@prisma/client');

async function checkInactiveMembers() {
  const prisma = new PrismaClient();

  try {
    const inactiveCount = await prisma.member.count({
      where: { isActive: false }
    });

    console.log('Total inactive members (isActive=false):', inactiveCount);

    // Also check total members
    const totalCount = await prisma.member.count();
    console.log('Total members:', totalCount);

    // Check for inactive state in dataLookup
    const inactiveStates = await prisma.dataLookup.findMany({
      where: { value: 'object_state_inactive' },
      select: { id: true, value: true }
    });

    console.log('\nInactive states in dataLookup:', inactiveStates.length);

    if (inactiveStates.length > 0) {
      const inactiveStateId = inactiveStates[0].id;
      const membersWithInactiveState = await prisma.member.count({
        where: { stateId: inactiveStateId }
      });
      console.log('Members with inactive state:', membersWithInactiveState);

      if (membersWithInactiveState > 0) {
        const inactiveMembers = await prisma.member.findMany({
          where: { stateId: inactiveStateId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            type: { select: { value: true } },
            councilFellowship: { select: { name: true } }
          },
          take: 5
        });

        console.log('\nMembers with inactive state:');
        inactiveMembers.forEach(m => {
          console.log(`- ${m.firstName} ${m.lastName} (${m.type?.value}) - ${m.councilFellowship?.name}`);
        });
      }
    }

    if (inactiveCount === 0) {
      console.log('\nNo inactive members found in the database.');
      console.log('This explains why the dashboard shows "No inactive members found".');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInactiveMembers();
