
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ids = [
    '15888c08-4850-4197-b5ec-90f69453c23c',
    'ffd97aea-3483-43b2-a996-50c77f971b7b'
  ];
  
  const files = await prisma.file.findMany({
    where: { id: { in: ids } },
    include: { member: true, councilFellowship: true }
  });
  
  console.log('--- Checking previously fixed test_files ---');
  files.forEach(f => {
    console.log(`ID: ${f.id}`);
    console.log(`   File: ${f.file}`);
    console.log(`   Owner Member: ${f.member ? f.member.fullName : 'None'} (${f.memberId})`);
    console.log(`   Owner Fellowship: ${f.councilFellowship ? f.councilFellowship.name : 'None'} (${f.councilFellowshipId})`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
