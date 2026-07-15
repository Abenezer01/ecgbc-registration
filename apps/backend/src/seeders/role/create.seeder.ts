import { DataLookup } from "@prisma/client";
import prisma from "../../app/config/db.config";
import { RoleType } from "../../app/features/role/enums/role-type.enum";
import { CommonObjectState } from "../../app/features/data-lookup/enums/data-lookup.enum";

interface NewRole {
  name: string;
  description: string;
  type: DataLookup;
  state: DataLookup;
}
export const seedRoles = async (): Promise<any> => {
  const state = (await prisma.dataLookup.findUnique({
    where: { value: CommonObjectState.ACTIVE },
  })) as unknown as DataLookup;
  const owner = (await prisma.dataLookup.findUnique({
    where: { value: RoleType.OWNER },
  })) as unknown as DataLookup;

  const admin = (await prisma.dataLookup.findUnique({
    where: { value: RoleType.ADMIN },
  })) as unknown as DataLookup;

  const lookAdmin = (await prisma.dataLookup.findUnique({
    where: { value: RoleType.LOOK_ADMIN },
  })) as unknown as DataLookup;

  const roles: NewRole[] = [
    {
      name: "Owner",
      description: "Owner / Super Admin",
      type: owner,
      state,
    },
    {
      name: "Admin",
      description: "Admin",
      type: admin,
      state,
    },
    {
      name: "Lookup Admin",
      description: "Lookup Admin",
      type: lookAdmin,
      state,
    },
  ];

  await Promise.all(
    roles.map(async (role) => {
      await prisma.role.upsert({
        where: { name: role.name }, // Assuming 'email' is a unique field
        update: {}, // If you don't want to update, keep it empty
        create: {
          name: role.name,
          description: role.description,
          typeId: role.type.id,
          stateId: role.state.id,
        },
      });
    })
  );
};
