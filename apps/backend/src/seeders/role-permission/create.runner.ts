import { seedRolePermissions } from "./create.seeder";

seedRolePermissions().catch((error)=>{
    console.log(`Error while seeding role permissions`);
    console.log(error)
    
}).finally(()=>{
    console.log('Seeding role permissions finished successfully.')
});