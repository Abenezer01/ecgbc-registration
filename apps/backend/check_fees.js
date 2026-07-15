const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Fee Rules ---');
  const feeRules = await prisma.feeRule.findMany();
  console.log(feeRules);
  
  console.log('\n--- Category Fee Rates ---');
  const catRates = await prisma.categoryFeeRate.findMany();
  console.log(catRates);
  
  console.log('\n--- Data Lookups (types/categories) ---');
  const dataLookups = await prisma.dataLookup.findMany({
    where: { type: { in: ['MEMBER_CATEGORY', 'MEMBER_TYPE'] } }
  });
  console.log(dataLookups);
  
  console.log('\n--- Members ---');
  const membersCount = await prisma.member.count();
  console.log('Total members:', membersCount);
  
  if (membersCount > 0) {
    const firstMember = await prisma.member.findFirst();
    console.log('Sample member typeId:', firstMember.typeId, 'categoryId:', firstMember.memberCategoryId);
  }
}

main().finally(() => prisma.$disconnect());
