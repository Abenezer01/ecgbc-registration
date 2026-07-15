const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking member types and counts...');
  
  // Count members with church type
  const churchCount = await prisma.member.count({
    where: {
      type: {
        value: 'member_type_church'
      }
    }
  });
  
  // Count members with ministry type
  const ministryCount = await prisma.member.count({
    where: {
      type: {
        value: 'member_type_ministry'
      }
    }
  });
  
  console.log('Members with church type:', churchCount);
  console.log('Members with ministry type:', ministryCount);
  
  // Check all member types
  const allTypes = await prisma.dataLookup.findMany({
    where: {
      value: { contains: 'member_type' }
    }
  });
  
  console.log('\nAll member types:');
  allTypes.forEach(type => {
    console.log('- ' + type.value + ': ' + type.description);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
