const { PrismaClient } = require('@prisma/client');

async function checkSuperadmin() {
  const prisma = new PrismaClient();

  try {
    const staff = await prisma.staff.findFirst({
      where: { email: 'admin@ecgbc.com' },
      include: {
        role: {
          include: {
            type: true,
            permissions: true
          }
        }
      }
    });

    console.log('Superadmin role:', staff.role.type.value);
    console.log('Permissions:');
    staff.role.permissions.forEach(p => {
      console.log(' -', p.codeName);
    });

    const hasDeactivate = staff.role.permissions.some(p => p.codeName === 'deactivate_member');
    console.log('\nHas deactivate_member permission:', hasDeactivate);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperadmin();
