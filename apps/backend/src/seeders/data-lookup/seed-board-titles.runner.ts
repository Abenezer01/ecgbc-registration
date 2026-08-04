import { seedBoardTitles } from "./seed-board-titles";

seedBoardTitles()
  .catch((err) => console.error(err))
  .finally(() => console.log("Board titles seeder finished."));
