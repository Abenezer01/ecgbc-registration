import { seedRoles } from "./create.seeder";

seedRoles().catch((error)=>{
    console.log(`Error while seeding roles`);
    console.log(error)
    
}).finally(()=>{
    console.log('Seeding roles finished successfully.')
});