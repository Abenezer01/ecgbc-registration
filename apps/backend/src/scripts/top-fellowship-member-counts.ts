import 'dotenv/config';
import prisma from '../app/config/db.config';

async function main() {
  // Get counts by councilFellowshipId
  const rows = await prisma.member.groupBy({
    by: ['councilFellowshipId'],
    _count: { _all: true },
  });

  const filtered = rows.filter((r) => r.councilFellowshipId !== null) as Array<{
    councilFellowshipId: string;
    _count: { _all: number };
  }>;

  const sorted = filtered.sort((a, b) => b._count._all - a._count._all).slice(0, 25);

  const ids = sorted.map((r) => r.councilFellowshipId);
  const meta = ids.length
    ? await prisma.councilFellowship.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, certificateNo: true },
      })
    : [];
  const map = new Map(meta.map((m) => [m.id, m]));
  console.log('Top fellowships by member count:');
  for (const r of sorted) {
    const m = map.get(r.councilFellowshipId);
    const ident = m ? `${m.certificateNo} ${m.name}` : r.councilFellowshipId;
    console.log(`${r._count._all}\t${ident}`);
  }
}

main().finally(() => prisma.$disconnect());
