import prisma from "../../app/config/db.config";

async function deleteAllData() {
  // // Delete all data from the `CouncilFellowship` table
  // await prisma.councilFellowship.deleteMany();
  // // Delete all data from the `BoardMember` table
  // await prisma.boardMember.deleteMany();
  await prisma.member.deleteMany();
}

deleteAllData()
  .catch((error) => {
    console.log("Error deleting all data");

    console.error(error);
  })
  .finally(async () => {
    console.log(
      "All data deleted from CouncilFellowship and BoardMember and Member tables."
    );
  });
