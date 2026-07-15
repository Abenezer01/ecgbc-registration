const { PrismaClient } = require('@prisma/client');

async function checkAdminPermissions() {
  const prisma = new PrismaClient();

  try {
    const adminRole = await prisma.role.findFirst({
      where: { type: { value: 'role_type_admin' } },
      include: { permissions: true }
    });

    console.log('Admin role permissions:');
    adminRole.permissions.forEach(p => {
      console.log(' -', p.codeName);
    });

    const hasDeactivate = adminRole.permissions.some(p => p.codeName === 'deactivate_member');
    console.log('\nHas deactivate_member permission:', hasDeactivate);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();
