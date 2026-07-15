import { seedPermissions } from "./create.seeder";

seedPermissions().catch((error)=>{
    console.log(`Error while seeding permissions`);
    console.log(error)
    
}).finally(()=>{
    console.log('Seeding permissions finished successfully.')
});