const { PrismaClient } = require('@prisma/client');

async function testQuery() {
  const prisma = new PrismaClient();

  try {
    const inactiveState = await prisma.dataLookup.findFirst({
      where: { value: 'object_state_inactive' }
    });

    console.log('Inactive state:', inactiveState);

    if (inactiveState) {
      const count = await prisma.member.count({
        where: { stateId: inactiveState.id }
      });

      console.log('Count with stateId:', count);

      const members = await prisma.member.findMany({
        where: { stateId: inactiveState.id },
        take: 1
      });

      console.log('Sample member ID:', members[0]?.id);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
