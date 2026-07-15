import { seedDataLookups } from "./create.seeder";


seedDataLookups()
  .catch((error) => {
    console.log(`Error while seeding data lookup`);
    console.log(error);
  })
  .finally(() => {
    console.log("Seeding data lookup finished successfully.");
  });