const { PrismaClient } = require('@prisma/client');

async function checkInactiveCount() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.member.count({
      where: { stateId: '14758cd3-2f83-4da5-8943-224aabe42f30' }
    });

    console.log('Members with inactive stateId:', count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInactiveCount();
