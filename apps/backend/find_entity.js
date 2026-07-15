
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const term = "012019";
  
  console.log(`Searching for '${term}' in Members and Fellowships...`);

  const members = await prisma.member.findMany({
    where: {
      OR: [
        { id: term },
        { idNumber: { contains: term } }, // Assuming there's an ID number or similar field
        { fullName: { contains: term } }
      ]
    }
  });
  
  // Checking schema for fellowship fields might be needed, but assuming name/code
  const fellowships = await prisma.councilFellowship.findMany({
    where: {
        OR: [
            { id: { contains: term } },
            { name: { contains: term } },
             // Assuming there might be a code field, if not it will just search what exists
             // but let's stick to generic known fields or check schema
        ]
    },
    include: {
      files: true // Include files to see what's attached
    }
  });

  console.log(`Members found: ${members.length}`);
  members.forEach(m => console.log(` - ${m.fullName} (${m.id})`));
  
  console.log(`Fellowships found: ${fellowships.length}`);
  fellowships.forEach(f => {
    console.log(` - ${f.name} (${f.id})`);
    console.log(`   Files: ${f.files.length}`);
    f.files.forEach(file => {
        console.log(`     -> ${file.fileName} (${file.file})`);
    })
  });
  
  // also check if any file has 012019 in filename attached to the fellowship "f6243430..."
  const fellowshipId = 'f6243430-e08b-49f1-ad81-88637dfdb752';
  const fellowshipFiles = await prisma.file.findMany({
      where: { councilFellowshipId: fellowshipId }
  });
  console.log('\n--- Files for Fellowship "f6243430..." (Owner of test_files) ---');
  fellowshipFiles.forEach(f => {
      console.log(`ID: ${f.id} | Name: ${f.fileName} | Path: ${f.file}`);
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
