import prisma from '../../app/config/db.config';

async function main() {
  const name = process.env.MISSING_FELLOWSHIP_NAME || 'አዲስ ቤተ-እመነት';
  let cert = process.env.MISSING_FELLOWSHIP_CERT || '';

  const existing = await prisma.councilFellowship.findUnique({ where: { name } });
  if (existing) {
    console.log('Already exists:', existing.name, existing.certificateNo);
    return;
  }

  if (!cert) {
    // Try a few candidate certificate numbers until unique
    const candidates = ['9776', '9001', '9002', '9003'];
    for (const c of candidates) {
      const taken = await prisma.councilFellowship.findUnique({ where: { certificateNo: c } });
      if (!taken) { cert = c; break; }
    }
    if (!cert) {
      cert = Math.floor(1000 + Math.random() * 9000).toString();
    }
  }

  const created = await prisma.councilFellowship.create({
    data: {
      name,
      certificateNo: cert,
      certificateIssuedDate: new Date(),
      isInEthiopia: true,
      city: 'Addis Ababa',
    },
  });
  console.log('Created fellowship:', created.name, created.certificateNo);
}

main().finally(() => prisma.$disconnect());
