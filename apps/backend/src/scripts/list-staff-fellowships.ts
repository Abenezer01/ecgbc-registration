import "dotenv/config";
import prisma from '../app/config/db.config';

console.log("Starting the staff fellowship listing script...");

async function list(email: string) {
  const staff = await prisma.staff.findUnique({ where: { email }, select: { id: true, email: true, fullName: true } });
  if (!staff) {
    console.log('No staff found for', email);
    return;
  }
  const links = await (prisma as any).staffFellowship.findMany({
    where: { staffId: staff.id },
    select: { fellowshipId: true },
  });
  const ids = links.map((l: any) => l.fellowshipId);
  const fellowships = ids.length
    ? await prisma.councilFellowship.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, certificateNo: true },
        orderBy: { name: 'asc' },
      })
    : [];
  console.log(`Staff: ${staff.fullName} <${staff.email}>`);
  console.log(`Linked fellowships (${fellowships.length}):`);
  for (const f of fellowships) console.log('-', f.certificateNo, f.name);
}

async function main() {
  const emails = process.argv.slice(2);
  for (const e of emails) {
    await list(e);
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
