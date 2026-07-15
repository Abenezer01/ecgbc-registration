const { PrismaClient } = require('@prisma/client');

async function checkStates() {
  const prisma = new PrismaClient();

  try {
    const states = await prisma.dataLookup.findMany({
      where: { category: 'member_state' },
      select: { id: true, value: true, category: true }
    });

    console.log('Member states:');
    states.forEach(s => {
      console.log(`  ${s.id}: ${s.value}`);
    });

    // Also check all dataLookup entries
    const all = await prisma.dataLookup.findMany({
      select: { id: true, value: true, category: true }
    });

    console.log('\nAll dataLookup entries:');
    all.forEach(s => {
      console.log(`  ${s.id}: ${s.value} (${s.category})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStates();
