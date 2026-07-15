import 'dotenv/config';
import prisma from '../app/config/db.config';

function normalizeCanonical(s: string) {
  return s
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t\r\n\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripAllSpaces(s: string) {
  return normalizeCanonical(s).replace(/\s+/g, '');
}

async function main() {
  const q = process.argv.slice(2).join(' ');
  const all = await prisma.councilFellowship.findMany({ select: { id: true, name: true, certificateNo: true } });
  const targetNorm = normalizeCanonical(q);
  const targetNoSpace = stripAllSpaces(q);

  const hits = all.filter(f => {
    const n = normalizeCanonical(f.name);
    const ns = stripAllSpaces(f.name);
    return (
      n.includes(targetNorm) ||
      ns.includes(targetNoSpace) ||
      // Also match by certificateNo (exact or partial, space-insensitive)
      f.certificateNo.includes(targetNoSpace)
    );
  });

  console.log('Query:', q);
  console.log('Matches:', hits.length);
  for (const h of hits) {
    console.log('-', h.certificateNo, h.name);
  }
}

main().finally(() => prisma.$disconnect());
