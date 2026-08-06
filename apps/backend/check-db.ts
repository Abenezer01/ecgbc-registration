import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const types = await prisma.dataLookup.findMany({where: {type: 'ROLE_TYPE'}});
  console.log(types);
}
main().finally(() => prisma.$disconnect());
