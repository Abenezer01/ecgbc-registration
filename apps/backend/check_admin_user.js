const { PrismaClient } = require('@prisma/client');

async function checkAdmin() {
  const prisma = new PrismaClient();

  try {
    const staff = await prisma.staff.findFirst({
      where: { email: 'admin@ecgbc.com' },
      select: { fullName: true, email: true, firstName: true, lastName: true }
    });

    console.log('Admin user:', staff);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
