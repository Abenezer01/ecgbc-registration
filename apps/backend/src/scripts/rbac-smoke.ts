import 'dotenv/config';
import prisma from '../app/config/db.config';

// Minimal enum mirrors for values stored in DataLookup.value
const MemberType = {
  MINISTRY: 'MINISTRY',
  CHURCH: 'CHURCH',
} as const;

const emailsToCheck = [
  'gezuabiy@gmail.com',
  'ephibillioner@gmail.com',
  'abateabinet94@gmail.com',
  'kiyagudina07@gmail.com',
  'mehirit2067@gmail.com',
  process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
];

type WeekRange = { startOfWeek: Date; endOfWeek: Date };
function getWeekRange(): WeekRange {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // days since Monday
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { startOfWeek: start, endOfWeek: end };
}

async function getAllowedFellowshipIds(staffId: string): Promise<string[]> {
  const links = await (prisma as any).staffFellowship.findMany({
    where: { staffId },
    select: { fellowshipId: true },
  });
  return (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
}

function hasPermission(perms: Array<{ codeName: string }>, code: string) {
  return perms.some((p) => p.codeName === code);
}

async function runFor(email: string) {
  const staff = await prisma.staff.findUnique({
    where: { email },
    include: {
      role: { include: { type: true, permissions: true } },
    },
  });
  if (!staff) {
    console.log(`-- ${email}: staff not found`);
    return;
  }

  const isOwner = staff.role?.type?.value === 'OWNER';
  const allowedFellowshipIds = isOwner ? [] : await getAllowedFellowshipIds(staff.id);
  const emailLc = (staff.email || '').toLowerCase();

  // Mirror middleware: Ephrem's MEMBER_DEACTIVATE is stripped at request-time
  let permCodes = (staff.role?.permissions || []).map((p) => p.codeName);
  if (emailLc === 'ephibillioner@gmail.com') {
    permCodes = permCodes.filter((c) => c !== 'MEMBER_DEACTIVATE');
  }
  const canDeactivate = permCodes.includes('deactivate_member');
  const activeOnly = !canDeactivate; // matches middleware behavior

  console.log(`DEBUG ${email}: permCodes =`, permCodes);
  console.log(`DEBUG ${email}: canDeactivate =`, canDeactivate);

  // Special staff allowed type values (mirrors middleware intent)
  const allowedTypeValues = isOwner
    ? [MemberType.MINISTRY, MemberType.CHURCH]
    : ['gezuabiy@gmail.com', 'ephibillioner@gmail.com', 'abateabinet94@gmail.com', 'kiyagudina07@gmail.com', 'mehirit2067@gmail.com'].includes(emailLc)
      ? [MemberType.MINISTRY, MemberType.CHURCH]
      : undefined;
  const canSeeChurches = isOwner || !allowedTypeValues || allowedTypeValues.includes(MemberType.CHURCH);

  const { startOfWeek, endOfWeek } = getWeekRange();

  // Council fellowships
  const [totalCouncilFellowships, weeklyCouncilFellowships] = await Promise.all([
    isOwner
      ? prisma.councilFellowship.count({})
      : (allowedFellowshipIds.length
          ? prisma.councilFellowship.count({ where: { id: { in: allowedFellowshipIds } } })
          : Promise.resolve(0)),
    isOwner
      ? prisma.councilFellowship.count({
          where: { createdAt: { gte: startOfWeek, lte: endOfWeek } },
        })
      : (allowedFellowshipIds.length
          ? prisma.councilFellowship.count({
              where: { id: { in: allowedFellowshipIds }, createdAt: { gte: startOfWeek, lte: endOfWeek } },
            })
          : Promise.resolve(0)),
  ]);

  // Ministries
  const ministryWhere: any = isOwner
    ? { type: { value: MemberType.MINISTRY } }
    : (allowedFellowshipIds.length ? { type: { value: MemberType.MINISTRY }, councilFellowshipId: { in: allowedFellowshipIds } } : { id: { in: [] } });
  if (activeOnly) ministryWhere.isActive = true;

  const [totalMinistries, weeklyMinistries] = await Promise.all([
    prisma.member.count({ where: ministryWhere }),
    prisma.member.count({ where: { ...ministryWhere, createdAt: { gte: startOfWeek, lte: endOfWeek } } }),
  ]);

  // Churches
  let totalChurches = 0, weeklyChurches = 0;
  if (canSeeChurches) {
    const churchWhere: any = isOwner
      ? { type: { value: MemberType.CHURCH } }
      : (allowedFellowshipIds.length ? { type: { value: MemberType.CHURCH }, councilFellowshipId: { in: allowedFellowshipIds } } : { id: { in: [] } });
    if (activeOnly) churchWhere.isActive = true;
    [totalChurches, weeklyChurches] = await Promise.all([
      prisma.member.count({ where: churchWhere }),
      prisma.member.count({ where: { ...churchWhere, createdAt: { gte: startOfWeek, lte: endOfWeek } } }),
    ]);
  }

  // Inactive counts (only meaningful if canDeactivate)
  let inactiveCount = 0;
  if (canDeactivate) {
    const inactiveWhere: any = isOwner ? { isActive: false } : { isActive: false, councilFellowshipId: { in: allowedFellowshipIds } };
    inactiveCount = await prisma.member.count({ where: inactiveWhere });
  }

  // Load fellowships list for visibility
  const fellowships = isOwner
    ? []
    : (allowedFellowshipIds.length
        ? await prisma.councilFellowship.findMany({ where: { id: { in: allowedFellowshipIds } }, select: { id: true, name: true, certificateNo: true }, orderBy: { name: 'asc' } })
        : []);

  console.log('============================================================');
  console.log(`Staff: ${staff.fullName} <${staff.email}> | RoleType=${staff.role?.type?.value} | Active-only=${activeOnly} | CanDeactivate=${canDeactivate}`);
  if (!isOwner) {
    console.log(`Linked fellowships (${fellowships.length}):`);
    for (const f of fellowships) console.log(`- ${f.certificateNo} ${f.name}`);
  } else {
    console.log('Owner: full access');
  }
  console.log('Dashboard-like stats within scope:');
  console.log(`- Council Fellowships: total=${totalCouncilFellowships} weekly=${weeklyCouncilFellowships}`);
  console.log(`- Ministries: total=${totalMinistries} weekly=${weeklyMinistries}`);
  console.log(`- Churches: ${canSeeChurches ? `total=${totalChurches} weekly=${weeklyChurches}` : 'HIDDEN (no permission)'}`);
  if (canDeactivate) console.log(`- Inactive Members (all types): ${inactiveCount}`);
}

async function main() {
  for (const email of emailsToCheck) {
    try {
      await runFor(email);
    } catch (e) {
      console.error(`Error while processing ${email}:`, e);
    }
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
