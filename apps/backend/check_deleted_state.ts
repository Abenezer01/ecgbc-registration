
import prisma from "./src/app/config/db.config";

async function checkDeletedState() {
  const deletedState = await prisma.dataLookup.findFirst({
    where: { value: "objecjt_state_deleted" }, // Matching the enum typo "objecjt"
  });
  console.log("Deleted state found:", deletedState);
  
  if (!deletedState) {
    console.log(" Creating missing DELETED state...");
    await prisma.dataLookup.create({
      data: {
        value: "objecjt_state_deleted",
        type: "object_state", 
        description: "Deleted",
        category: "common",
        index: 99,
        isDefault: false,
        note: "System created deleted state",
      }
    });
    console.log("Created successfully");
  }
}

checkDeletedState()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
