import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.dataLookup.findMany({
    select: { type: true },
    distinct: ['type']
  });
  console.log(types.map(t => t.type));
}
main().catch(console.error).finally(() => prisma.$disconnect());
