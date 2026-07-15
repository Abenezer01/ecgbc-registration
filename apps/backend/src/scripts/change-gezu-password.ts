
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "gezuabiy@gmail.com";
  const newPasswordPlain = "Gezu@123!";
  
  console.log(`Updating password for: ${email}`);
  
  const staff = await prisma.staff.findUnique({
    where: { email },
  });

  if (!staff) {
    console.log("Staff not found");
    return;
  }

  const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);
  
  await prisma.staff.update({
      where: { email },
      data: {
          password: hashedPassword
      }
  });

  console.log(`Password successfully updated to: ${newPasswordPlain}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
