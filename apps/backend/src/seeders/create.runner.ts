// import consola from "consola";
import { seedPermissions } from "./permission/create.seeder";
import { seedRoles } from "./role/create.seeder";
import { seedRolePermissions } from "./role-permission/create.seeder";
import { seedStaff } from "./staff/create.seeder";
import { seedDataLookups } from "./data-lookup/create.seeder";
import { seedCouncilFellowships } from "./council-fellowship/create.seeder";

(async () => {
await seedDataLookups();
await seedPermissions();
await seedRoles();
await seedRolePermissions();
await seedStaff();
await seedCouncilFellowships();
})().catch(err=> console.log(err)).finally(() => console.log(`Create seeder finished successfully.`))