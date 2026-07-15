import 'dotenv/config';
import { seedStaff } from "./create.seeder";

seedStaff().catch((error)=>{
    console.log(`Error while seeding staff`);
    console.log(error)
    
}).finally(()=>{
    console.log('Seeding staff finished successfully.')
});