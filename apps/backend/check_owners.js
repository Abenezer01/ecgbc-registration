const { PrismaClient } = require('@prisma/client');

async function checkOwners() {
  const prisma = new PrismaClient();

  try {
    const owners = await prisma.staff.findMany({
      where: { role: { type: { value: 'role_type_owner' } } },
      select: { email: true }
    });

    console.log('Owner staff:');
    owners.forEach(o => {
      console.log(' -', o.email);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwners();
