import 'dotenv/config';
import prisma from '../app/config/db.config';
import { CommonObjectState } from '../app/features/data-lookup/enums/data-lookup.enum';

async function main() {
  const [activeState, inactiveState] = await Promise.all([
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.ACTIVE }, select: { id: true } }),
    prisma.dataLookup.findFirst({ where: { value: CommonObjectState.IN_ACTIVE }, select: { id: true } }),
  ]);

  if (!activeState?.id || !inactiveState?.id) {
    throw new Error('Failed to resolve active/inactive state IDs');
  }

  const fixInactive = await prisma.member.updateMany({
    where: {
      stateId: inactiveState.id,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  const fixActive = await prisma.member.updateMany({
    where: {
      stateId: activeState.id,
      isActive: false,
    },
    data: {
      isActive: true,
      reasonForInactive: null,
    },
  });

  console.log('Sync complete. Rows updated:');
  console.log(' - Set isActive=false for inactive state:', fixInactive.count);
  console.log(' - Set isActive=true for active state:', fixActive.count);
}

main()
  .catch((err) => {
    console.error('Error syncing inactive flags:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
