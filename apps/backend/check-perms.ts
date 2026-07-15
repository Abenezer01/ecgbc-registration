import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({ include: { permissions: true } }); 
  console.dir(roles.map(r => ({name: r.name, perms: r.permissions.map(p=>p.codeName)})), {depth: null}); 

  // Also manually connect view_finance and manage_finance to all roles for now
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
  }
  console.log("Forced permissions on all roles.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
