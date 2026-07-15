import { seedCouncilFellowships } from "./create.seeder";

seedCouncilFellowships()
  .catch((error) => {
    console.log(`Error while seeding Council fellowhips`);
    console.log(error);
  })
  .finally(() => {
    console.log("Seeding Council fellowhips finished successfully.");
  });
