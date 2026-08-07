import { seedFileCategories } from "./seed-file-categories";

const run = async () => {
  try {
    await seedFileCategories();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding file categories:", error);
    process.exit(1);
  }
};

run();
