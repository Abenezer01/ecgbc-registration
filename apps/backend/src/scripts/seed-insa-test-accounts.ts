import prisma from "../app/config/db.config";
import bcrypt from "bcryptjs";
import { RoleType } from "../app/features/role/enums/role-type.enum";
import { CommonObjectState } from "../app/features/data-lookup/enums/data-lookup.enum";

async function main() {
  console.log("=================================================");
  console.log("   ECGBC INSA Security Audit Test Account Seeder");
  console.log("=================================================\n");

  const activeState = await prisma.dataLookup.findUnique({
    where: { value: CommonObjectState.ACTIVE },
  });

  if (!activeState) {
    console.error("Active state data lookup not found. Please run seeders first.");
    process.exit(1);
  }

  // 1. Roles
  const ownerRole = await prisma.role.findFirst({
    where: { type: { value: RoleType.OWNER } },
  });
  const staffRole = await prisma.role.findFirst({
    where: { name: "Staff" },
  }) || ownerRole;

  if (!ownerRole) {
    console.error("Owner role not found. Please run core role seeders first.");
    process.exit(1);
  }

  // Configurable passwords for test accounts
  const superAdminPass = process.env.INSA_ADMIN_PASS || "InsaAdmin#2026!Audit";
  const reviewerPass = process.env.INSA_REVIEWER_PASS || "InsaReviewer#2026!Audit";
  const church1Pass = process.env.INSA_CHURCH1_PASS || "InsaChurch1#2026!Audit";
  const church2Pass = process.env.INSA_CHURCH2_PASS || "InsaChurch2#2026!Audit";

  // Hash passwords
  const [hSuper, hReviewer, hChurch1, hChurch2] = await Promise.all([
    bcrypt.hash(superAdminPass, 10),
    bcrypt.hash(reviewerPass, 10),
    bcrypt.hash(church1Pass, 10),
    bcrypt.hash(church2Pass, 10),
  ]);

  // 2. Staff Accounts
  // Super Admin
  const superAdmin = await prisma.staff.upsert({
    where: { email: "insa-admin@ecgbc.org" },
    update: {
      password: hSuper,
      roleId: ownerRole.id,
      stateId: activeState.id,
    },
    create: {
      email: "insa-admin@ecgbc.org",
      firstName: "INSA",
      lastName: "SuperAdmin",
      fullName: "INSA Super Admin",
      password: hSuper,
      phoneNumber: "+251911000001",
      roleId: ownerRole.id,
      stateId: activeState.id,
    },
  });

  // Scoped Staff / Reviewer
  const reviewer = await prisma.staff.upsert({
    where: { email: "insa-reviewer@ecgbc.org" },
    update: {
      password: hReviewer,
      roleId: staffRole?.id || ownerRole.id,
      stateId: activeState.id,
    },
    create: {
      email: "insa-reviewer@ecgbc.org",
      firstName: "INSA",
      lastName: "Reviewer",
      fullName: "INSA Staff Reviewer",
      password: hReviewer,
      phoneNumber: "+251911000002",
      roleId: staffRole?.id || ownerRole.id,
      stateId: activeState.id,
    },
  });

  // 3. Find or create two distinct churches for cross-tenant testing
  const existingMembers = await prisma.member.findMany({
    take: 2,
    select: { id: true, name: true, certificateNo: true },
  });

  let member1Id = existingMembers[0]?.id;
  let member2Id = existingMembers[1]?.id;

  if (member1Id) {
    await prisma.churchUser.upsert({
      where: { email: "insa-church1@ecgbc.org" },
      update: {
        password: hChurch1,
        memberId: member1Id,
        isActive: true,
        role: "ADMIN",
      },
      create: {
        email: "insa-church1@ecgbc.org",
        firstName: "INSA",
        lastName: "ChurchAlpha",
        password: hChurch1,
        phone: "+251911000003",
        role: "ADMIN",
        isActive: true,
        memberId: member1Id,
      },
    });
  }

  if (member2Id) {
    await prisma.churchUser.upsert({
      where: { email: "insa-church2@ecgbc.org" },
      update: {
        password: hChurch2,
        memberId: member2Id,
        isActive: true,
        role: "ADMIN",
      },
      create: {
        email: "insa-church2@ecgbc.org",
        firstName: "INSA",
        lastName: "ChurchBeta",
        password: hChurch2,
        phone: "+251911000004",
        role: "ADMIN",
        isActive: true,
        memberId: member2Id,
      },
    });
  }

  console.log("Successfully seeded INSA Audit Test Accounts:\n");
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log("| Portal        | Role                 | Email                    | Password               | Purpose     |");
  console.log("---------------------------------------------------------------------------------------------------------");
  console.log(`| Admin Portal  | Super Administrator  | insa-admin@ecgbc.org     | ${superAdminPass}  | Full System |`);
  console.log(`| Admin Portal  | Staff Reviewer       | insa-reviewer@ecgbc.org  | ${reviewerPass} | Review/RBAC |`);
  if (member1Id) {
    console.log(`| Church Portal | Church Admin (A)     | insa-church1@ecgbc.org   | ${church1Pass}  | Tenant A    |`);
  }
  if (member2Id) {
    console.log(`| Church Portal | Church Admin (B)     | insa-church2@ecgbc.org   | ${church2Pass}  | Tenant B    |`);
  }
  console.log("---------------------------------------------------------------------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("Error seeding INSA test accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
