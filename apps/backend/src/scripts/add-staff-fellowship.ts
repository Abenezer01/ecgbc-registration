import "dotenv/config";
import prisma from '../app/config/db.config';

console.log("Starting the staff fellowship addition script...");

async function addFellowship(email: string, fellowshipName: string) {
  // Find the staff member
  const staff = await prisma.staff.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true }
  });

  if (!staff) {
    console.log('No staff found for', email);
    return;
  }

  // Find the fellowship by name
  const fellowship = await prisma.councilFellowship.findFirst({
    where: { name: fellowshipName },
    select: { id: true, name: true, certificateNo: true }
  });

  if (!fellowship) {
    console.log('No fellowship found with name:', fellowshipName);
    return;
  }

  console.log(`Found staff: ${staff.fullName} <${staff.email}>`);
  console.log(`Found fellowship: ${fellowship.certificateNo} - ${fellowship.name}`);

  // Check if the relationship already exists
  const existingLink = await prisma.staffFellowship.findUnique({
    where: {
      staffId_fellowshipId: {
        staffId: staff.id,
        fellowshipId: fellowship.id
      }
    }
  });

  if (existingLink) {
    console.log('Relationship already exists between this staff and fellowship');
    return;
  }

  // Create the relationship
  await prisma.staffFellowship.create({
    data: {
      staffId: staff.id,
      fellowshipId: fellowship.id
    }
  });

  console.log(`✅ Successfully added ${fellowship.name} to ${staff.fullName}'s access`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log('Usage: npm run script:add-staff-fellowship <email> <fellowship-name>');
    console.log('Example: npm run script:add-staff-fellowship ephibillioner@gmail.com "የኢትዮጵያ ፔንቴኮስታል አብያተ ክርስቲያናት ሕብረት"');
    process.exit(1);
  }

  const [email, fellowshipName] = args;
  await addFellowship(email, fellowshipName);
}

main().finally(() => prisma.$disconnect());
