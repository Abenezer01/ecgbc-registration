import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FILES_DIR = path.join(__dirname, '../../public/files/file');

async function main() {
  const files = fs.readdirSync(FILES_DIR).filter(f => f.endsWith('.pdf'));
  let restored = 0;

  for (const fileName of files) {
    // Check if file exists in DB
    const dbFile = await prisma.file.findFirst({ where: { fileName } });
    if (!dbFile) {
      // Try to extract memberId from filename (if convention exists)
      // Example: <memberId>-xxxx.pdf or similar
      const match = fileName.match(/([a-zA-Z0-9]+)-[a-f0-9\-]+\.pdf$/);
      let memberId = match ? match[1] : null;
      // If memberId found, link file to member
      if (memberId) {
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (member) {
          await prisma.file.create({
            data: {
              fileName,
              file: fileName,
              memberId: member.id,
            },
          });
          restored++;
          console.log(`Restored: ${fileName} -> member ${memberId}`);
        } else {
          console.log(`Orphan file (no member): ${fileName}`);
        }
      } else {
        console.log(`Orphan file (no memberId in filename): ${fileName}`);
      }
    }
  }
  console.log(`Restoration complete. ${restored} files re-linked.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
