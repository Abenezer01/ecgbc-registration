const { PrismaClient } = require('@prisma/client');

async function checkOwnerPermissions() {
  const prisma = new PrismaClient();

  try {
    const ownerRole = await prisma.role.findFirst({
      where: { type: { value: 'role_type_owner' } },
      include: { permissions: true }
    });

    console.log('Owner role permissions:');
    ownerRole.permissions.forEach(p => {
      console.log(' -', p.codeName);
    });

    // Check if MEMBER_DEACTIVATE is included
    const hasDeactivate = ownerRole.permissions.some(p => p.codeName === 'deactivate_member');
    console.log('\nHas MEMBER_DEACTIVATE permission:', hasDeactivate);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwnerPermissions();
