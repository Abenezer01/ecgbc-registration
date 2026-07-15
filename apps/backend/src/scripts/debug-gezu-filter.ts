
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "gezuabiy@gmail.com";
  console.log(`Checking user: ${email}`);
  
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: {
        fellowships: {
            include: {
                fellowship: true
            }
        },
        role: {
          include: {
            type: true
          }
        }
    },
  });

  if (!staff) {
    console.log("Staff not found");
    return;
  }

  console.log("Staff found:", staff.id);
  console.log("Role:", staff.role?.name);
  console.log("Role Type:", staff.role?.type);
  const isAdmin = staff.role?.name === 'admin' || staff.role?.name === 'super_admin';
  console.log("Is Admin Role?:", isAdmin);
  
  const allowed = staff.fellowships.map(sf => sf.fellowshipId);
  console.log("Allowed Fellowships:", allowed);


  // Simulate what `member.filter.ts` does
  let filters: any = {};
  
  if (!isAdmin) {
      if (allowed && allowed.length > 0) {
        filters = { ...filters, councilFellowshipId: { in: allowed } };
        console.log("Applying IN filter:", JSON.stringify(filters));
      } else {
        // This is the logic I added
        filters = { ...filters, id: "00000000-0000-0000-0000-000000000000" };
        console.log("Applying BLOCK filter:", JSON.stringify(filters));
      }
  } else {
      console.log("User is Admin, NO filter");
  }

  // Now run the query with these filters to see the count
  const count = await prisma.member.count({
      where: filters
  });
  console.log(`\nQuery result count with computed filters: ${count}`);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
