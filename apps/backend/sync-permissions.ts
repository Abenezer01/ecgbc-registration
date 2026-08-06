import { PrismaClient } from "@prisma/client";
import {
  MemberPermission,
  StaffPermission,
  PermissionPermission,
  RolePermission,
  CouncilFellowship,
  FilePermission,
  ReportPermission,
  FinancePermission,
  LogPermission,
  ChurchUserPermission,
  DashboardPermission
} from "./src/app/features/permission/enums/permission.enum";

const prisma = new PrismaClient();

async function main() {
  const allEnums = [
    MemberPermission,
    StaffPermission,
    PermissionPermission,
    RolePermission,
    CouncilFellowship,
    FilePermission,
    ReportPermission,
    FinancePermission,
    LogPermission,
    ChurchUserPermission,
    DashboardPermission
  ];
  const allPermCodes = allEnums.flatMap(e => Object.values(e));

  const createdPerms = [];
  for (const code of allPermCodes) {
    const perm = await prisma.permission.upsert({
      where: { codeName: code },
      update: {},
      create: { codeName: code, description: code.replace(/_/g, " ") },
    });
    createdPerms.push(perm);
  }

  const roleTypes = await prisma.dataLookup.findMany({
    where: { value: { in: ["role_type_owner", "role_type_admin"] } },
  });

  const typeIds = roleTypes.map(t => t.id);

  if (typeIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: { typeId: { in: typeIds } },
    });

    for (const role of roles) {
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: createdPerms.map(p => ({ id: p.id })),
          },
        },
      });
      console.log(`Updated permissions for role: ${role.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
