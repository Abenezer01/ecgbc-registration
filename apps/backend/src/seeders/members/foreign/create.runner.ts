import { seedMembers } from "./create.seeder";

seedMembers()
  .catch((error) => {
    console.log(`Error while seeding Members`);
    console.log(error);
  })
  .finally(() => {
    console.log("Seeding Members finished successfully.");
  });