import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const perms = [
    { codeName: "view_finance", description: "View Finance" },
    { codeName: "manage_finance", description: "Manage Finance" },
  ];

  for (const perm of perms) {
    await prisma.permission.upsert({
      where: { codeName: perm.codeName },
      update: {},
      create: perm,
    });
  }

  const roleTypes = await prisma.dataLookup.findMany({
    where: { type: "ROLE_TYPE", value: { in: ["OWNER", "ADMIN"] } },
  });

  const typeIds = roleTypes.map(t => t.id);

  if (typeIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: { typeId: { in: typeIds } },
    });

    const financePerms = await prisma.permission.findMany({
      where: { codeName: { in: ["view_finance", "manage_finance"] } },
    });

    for (const role of roles) {
      for (const p of financePerms) {
        await prisma.role.update({
          where: { id: role.id },
          data: {
            permissions: {
              connect: { id: p.id },
            },
          },
        });
      }
      console.log(`Finance permissions added to role: ${role.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
