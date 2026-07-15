import { DataLookup, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../../app/config/db.config";
import { RoleType } from "../../app/features/role/enums/role-type.enum";
import { CommonObjectState } from "../../app/features/data-lookup/enums/data-lookup.enum";
import { cleanEnv, email, str } from "envalid";
import { MemberPermission, ReportPermission, FilePermission, CouncilFellowship } from "../../app/features/permission/enums/permission.enum";

const env = cleanEnv(process.env, {
    SUPER_ADMIN_EMAIL: email(),
    SUPER_ADMIN_PASSWORD: str(),
  });

  
interface NewRole {
    name: string;
    description: string;
    type:DataLookup
    state:DataLookup
}
export const seedStaff = async (): Promise<any>=>{
    const state =( await prisma.dataLookup.findUnique({
        where:{value:CommonObjectState.ACTIVE}
    })) as unknown as DataLookup;
    const owner =( await prisma.role.findFirst({
        where:{type:{
            value:RoleType.OWNER
        }}
    })) as unknown as Role;

    const password = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 10);
  
   const superAdmin = await prisma.staff.upsert({
    where:{email:env.SUPER_ADMIN_EMAIL},
    update:{
        firstName:'Super',
        lastName:'Admin',
        fullName:'Super Admin',
        password: password,
        phoneNumber: '+251917808664',
        roleId:owner.id,
        stateId:state.id
    },
    create:{
        email: env.SUPER_ADMIN_EMAIL,
        firstName:'Super',
        lastName:'Admin',
        fullName:'Super Admin',
        password: password,
        phoneNumber: '+251917808664',
        roleId:owner.id,
        stateId:state.id
    }
   })
    
   // Ensure scoped staff with ADMIN role exists where needed (Ephrem) and seed permissions
   const adminRole = await prisma.role.findFirst({
     where: { type: { value: RoleType.ADMIN } },
   });
   if (adminRole) {
     // Ensure ADMIN has CRUD for members/reports/files
     const adminWithPerms = await prisma.role.findUnique({
       where: { id: adminRole.id },
       include: { permissions: true },
     });
     const neededCodes = [
       MemberPermission.MEMBER_VIEW,
       MemberPermission.MEMBER_ADD,
       MemberPermission.MEMBER_CHANGE,
       MemberPermission.MEMBER_DELETE,
       MemberPermission.MEMBER_DEACTIVATE,
       CouncilFellowship.COUNCIL_FELLOWSHIP_VIEW,
       ReportPermission.REPORT_VIEW,
       ReportPermission.REPORT_ADD,
       ReportPermission.REPORT_CHANGE,
       ReportPermission.REPORT_DELETE,
       FilePermission.FILE_VIEW,
       FilePermission.FILE_ADD,
       FilePermission.FILE_CHANGE,
       FilePermission.FILE_DELETE,
     ];
     const existingCodes = new Set((adminWithPerms?.permissions || []).map(p => p.codeName));
     const missingCodes = neededCodes.filter(c => !existingCodes.has(c));
     if (missingCodes.length) {
       const missingPerms = await prisma.permission.findMany({ where: { codeName: { in: missingCodes } } });
       if (missingPerms.length) {
         await prisma.role.update({
           where: { id: adminRole.id },
           data: { permissions: { connect: missingPerms.map(p => ({ id: p.id })) } },
         });
       }
     }

     // Ensure scoped staff (Ephrem) exists with ADMIN role and ACTIVE state
     const ephremPlain = process.env.EPHREM_PASSWORD || "@Ephi#Ende!391#";
     const ephremHashed = await bcrypt.hash(ephremPlain, 10);
     const ephrem = await prisma.staff.upsert({
       where: { email: "ephibillioner@gmail.com" },
       update: {
         firstName: "Ephrem",
         lastName: "(Scoped)",
         fullName: "Ephrem",
         password: ephremHashed,
         phoneNumber: "+251900000001",
         roleId: adminRole.id,
         stateId: state.id,
       },
       create: {
         email: "ephibillioner@gmail.com",
         firstName: "Ephrem",
         lastName: "(Scoped)",
         fullName: "Ephrem",
         password: ephremHashed,
         phoneNumber: "+251900000001",
         roleId: adminRole.id,
         stateId: state.id,
       },
       include: { role: true },
     });

     // Link Ephrem to the two allowed fellowships (by certificate number)
     const targetCertificates = ["1111"]; // 2) የኢትዮጵያ ...
     const fellowships = await prisma.councilFellowship.findMany({
       where: { certificateNo: { in: targetCertificates } },
       select: { id: true, certificateNo: true },
     });

     for (const f of fellowships) {
       // unique constraint on (staffId, fellowshipId)
       await prisma.staffFellowship.upsert({
         where: {
           staffId_fellowshipId: {
             staffId: ephrem.id,
             fellowshipId: f.id,
           },
         },
         update: {},
         create: {
           staffId: ephrem.id,
           fellowshipId: f.id,
         },
       });
     }
   }
   
   // Ensure a restricted Staff role exists and create scoped Staff users (Abinet, Chaltu, Mercy, Gezu)
   const customType = await prisma.dataLookup.findUnique({ where: { value: RoleType.CUSTOM } }) as unknown as DataLookup;
   if (customType) {
     // Upsert role named "Staff"
     let staffRole = await prisma.role.findFirst({ where: { name: "Staff" } });
     if (!staffRole) {
       staffRole = await prisma.role.create({
         data: {
           name: "Staff",
           description: "Restricted Staff",
           typeId: customType.id,
           stateId: state.id,
         },
       });
     }

     // Ensure Staff role has only the needed permissions
     const staffNeededPerms = [
       MemberPermission.MEMBER_VIEW,
       MemberPermission.MEMBER_ADD,
       MemberPermission.MEMBER_CHANGE,
       CouncilFellowship.COUNCIL_FELLOWSHIP_VIEW,
       // Intentionally exclude MEMBER_DEACTIVATE, MEMBER_DELETE
     ];
     const staffPerms = await prisma.permission.findMany({ where: { codeName: { in: staffNeededPerms } } });
     // Connect any missing perms
     if (staffPerms.length) {
       const existing = await prisma.role.findUnique({ where: { id: staffRole.id }, include: { permissions: true } });
       const existingCodes = new Set((existing?.permissions || []).map(p => p.codeName));
       const toConnect = staffPerms.filter(p => !existingCodes.has(p.codeName)).map(p => ({ id: p.id }));
       if (toConnect.length) {
         await prisma.role.update({ where: { id: staffRole.id }, data: { permissions: { connect: toConnect } } });
       }
       // Disconnect any extra permissions accidentally attached (hardening)
       const toKeep = new Set<string>(staffNeededPerms as unknown as string[]);
       const toDisconnect = (existing?.permissions || [])
         .filter(p => !toKeep.has(p.codeName as unknown as string))
         .map(p => ({ id: p.id }));
       if (toDisconnect.length) {
         await prisma.role.update({ where: { id: staffRole.id }, data: { permissions: { disconnect: toDisconnect } } });
       }
     }

     // Helper normalization for robust Amharic matching
     const normalizeCanonical = (s: string) =>
       s
         .normalize("NFKC")
         .replace(/[\u200B-\u200D\uFEFF]/g, "")
         .replace(/[ \t\r\n\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ")
         .replace(/\s+/g, " ")
         .trim();
     const stripAllSpaces = (s: string) => normalizeCanonical(s).replace(/\s+/g, "");

     // 2) Upsert Abinet Abate with Staff role
     const abinetEmail = "abateabinet94@gmail.com";
     const abinetPlain = "@Abate@AB!861#"; // provided default
     const abinetHashed = await bcrypt.hash(abinetPlain, 10);
     const abinet = await prisma.staff.upsert({
       where: { email: abinetEmail },
       update: {
         firstName: "Abinet",
         lastName: "Abate",
         fullName: "Abinet Abate",
         password: abinetHashed,
         phoneNumber: "+251900000002",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: abinetEmail,
         firstName: "Abinet",
         lastName: "Abate",
         fullName: "Abinet Abate",
         password: abinetHashed,
         phoneNumber: "+251900000002",
         roleId: staffRole.id,
         stateId: state.id,
       },
       include: { role: true },
     });

     // 3) Link Abinet to exactly the specified council fellowships
     // Supports linking by certificate numbers (env ABINET_FELLOWSHIP_CERTS=comma-separated)
     // or by names (env ABINET_FELLOWSHIP_NAMES=comma-separated exact names in Amharic)
     const certList = (process.env.ABINET_FELLOWSHIP_CERTS || "")
       .split(",")
       .map(s => s.trim())
       .filter(Boolean);
     const nameList = (process.env.ABINET_FELLOWSHIP_NAMES || "")
       .split(",")
       .map(s => s.trim())
       .filter(Boolean);

     let abinetFellowships: Array<{ id: string; name?: string }> = [];

     if (certList.length > 0) {
       abinetFellowships = await prisma.councilFellowship.findMany({
         where: { certificateNo: { in: certList } },
         select: { id: true, name: true },
       });
     } else if (nameList.length > 0) {
       // Robust match by strong normalization and a secondary no-space comparison
       const targets = nameList.map(n => ({ raw: n, norm: normalizeCanonical(n), nos: stripAllSpaces(n) }));
       const allFellowships = await prisma.councilFellowship.findMany({ select: { id: true, name: true } });
       const byNorm = new Map<string, { id: string; name: string }[]>();
       const byNoSpace = new Map<string, { id: string; name: string }[]>();
       for (const f of allFellowships) {
         const n = normalizeCanonical(f.name);
         const ns = stripAllSpaces(f.name);
         byNorm.set(n, [...(byNorm.get(n) || []), f]);
         byNoSpace.set(ns, [...(byNoSpace.get(ns) || []), f]);
       }

       const matched: { id: string; name: string }[] = [];
       const missing: string[] = [];
       for (const t of targets) {
         let candidates = byNorm.get(t.norm) || [];
         if (candidates.length === 1) {
           matched.push(candidates[0]);
           continue;
         }
         // Fallback to nospace match if exact-normalized isn't unique
         candidates = byNoSpace.get(t.nos) || [];
         if (candidates.length === 1) {
           matched.push(candidates[0]);
           continue;
         }
         // If still ambiguous or empty, mark missing for visibility
         missing.push(t.raw);
       }
       if (missing.length) {
         console.warn("[Seeder] Abinet missing fellowships (by name):", missing);
       }
       if (matched.length) {
         console.log("[Seeder] Abinet matched fellowships:", matched.map(m => m.name));
       }
       abinetFellowships = matched.map(f => ({ id: f.id, name: f.name }));
     }

     // If both envs are empty, skip linking (will be handled after names are provided)
     for (const f of abinetFellowships) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: abinet.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: abinet.id, fellowshipId: f.id },
       });
     }

     // Optionally, remove any previous links not in the target set (enforce exact five once provided)
     if (abinetFellowships.length > 0) {
       const keepIds = new Set(abinetFellowships.map(f => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: abinet.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter(l => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: abinet.id, fellowshipId: { in: toRemove.map(x => x.fellowshipId) } },
         });
       }
     }

     // 4) Upsert Chaltu (restricted Staff) and link to the specified fellowships by name
     const chaltuEmail = "kiyagudina07@gmail.com";
     const chaltuPlain = "chaltugudina@1234";
     const chaltuHashed = await bcrypt.hash(chaltuPlain, 10);
     const chaltu = await prisma.staff.upsert({
       where: { email: chaltuEmail },
       update: {
         firstName: "Chaltu",
         lastName: "",
         fullName: "Chaltu",
         password: chaltuHashed,
         phoneNumber: "+251900000003",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: chaltuEmail,
         firstName: "Chaltu",
         lastName: "",
         fullName: "Chaltu",
         password: chaltuHashed,
         phoneNumber: "+251900000003",
         roleId: staffRole.id,
         stateId: state.id,
       },
     });

     const chaltuFellowshipNames = [
       "የኢትዮጵያ ቪዥነሪ አብያተ ክርስቲያናት ሕብረት",
       "ርኆቦት አብያተ ክርስቲያት  ሕብረት",
       "የኢትዮጵያ ፔንቴኮስታል አብያተ ክርስቲያናት ሕብረት",
       "ሰላም ባለራዕዮች አብያተ ክርስቲያት ሕብረት",
       "የኢትዮጵያ የወንጌል ባለአደራዎች አብያተ ክርስቲያናት ሕብረት",
     ];

     // Robust name matching with unicode normalization and a secondary no-space comparison
     const chNormTargets = chaltuFellowshipNames.map(n => ({ raw: n, norm: normalizeCanonical(n), nos: stripAllSpaces(n) }));
     const allFellowshipsForChaltu = await prisma.councilFellowship.findMany({ select: { id: true, name: true } });
     const byNormC = new Map<string, { id: string; name: string }[]>();
     const byNoSpaceC = new Map<string, { id: string; name: string }[]>();
     for (const f of allFellowshipsForChaltu) {
       const n = normalizeCanonical(f.name);
       const ns = stripAllSpaces(f.name);
       byNormC.set(n, [...(byNormC.get(n) || []), f]);
       byNoSpaceC.set(ns, [...(byNoSpaceC.get(ns) || []), f]);
     }
     const chaltuMatches: { id: string; name: string }[] = [];
     const chMissing: string[] = [];
     for (const t of chNormTargets) {
       let candidates = byNormC.get(t.norm) || [];
       if (candidates.length === 1) {
         chaltuMatches.push(candidates[0]);
         continue;
       }
       candidates = byNoSpaceC.get(t.nos) || [];
       if (candidates.length === 1) {
         chaltuMatches.push(candidates[0]);
         continue;
       }
       chMissing.push(t.raw);
     }
     console.log("[Seeder] Chaltu matched fellowships:", chaltuMatches.map(f => f.name));
     if (chMissing.length) {
       console.warn("[Seeder] Chaltu missing fellowships:", chMissing);
     }

     // Allow explicit certificateNo overrides via env CHALTU_FELLOWSHIP_CERTS (comma-separated)
     const chaltuCertList = (process.env.CHALTU_FELLOWSHIP_CERTS || "")
       .split(",")
       .map((s) => s.trim())
       .filter(Boolean);
     let chaltuByCert: { id: string; name: string }[] = [];
     if (chaltuCertList.length) {
       const fetched = await prisma.councilFellowship.findMany({
         where: { certificateNo: { in: chaltuCertList } },
         select: { id: true, name: true },
       });
       chaltuByCert = fetched;
       if (fetched.length) {
         console.log("[Seeder] Chaltu matched by certificateNo:", fetched.map((f) => f.name));
       } else {
         console.warn("[Seeder] Chaltu certificateNo values not found:", chaltuCertList);
       }
     }

     // Union matches (name-based + cert-based) and dedupe by id
     const chaltuAllMatchesMap = new Map<string, { id: string; name: string }>();
     for (const f of [...chaltuMatches, ...chaltuByCert]) chaltuAllMatchesMap.set(f.id, f);
     const chaltuAllMatches = Array.from(chaltuAllMatchesMap.values());

     for (const f of chaltuAllMatches) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: chaltu.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: chaltu.id, fellowshipId: f.id },
       });
     }

     if (chaltuAllMatches.length > 0) {
       const keepIds = new Set(chaltuAllMatches.map(f => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: chaltu.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter(l => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: chaltu.id, fellowshipId: { in: toRemove.map(x => x.fellowshipId) } },
         });
       }
     }

     // 5) Upsert Mercy (restricted Staff) and link to the specified council fellowship(s)
     const mercyEmail = "mehirit2067@gmail.com";
     const mercyPlain = process.env.MERCY_PASSWORD || "Mehirit!#123@";
     const mercyHashed = await bcrypt.hash(mercyPlain, 10);
     const mercy = await prisma.staff.upsert({
       where: { email: mercyEmail },
       update: {
         firstName: "Mercy",
         lastName: "",
         fullName: "Mercy",
         password: mercyHashed,
         phoneNumber: "+251900000004",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: mercyEmail,
         firstName: "Mercy",
         lastName: "",
         fullName: "Mercy",
         password: mercyHashed,
         phoneNumber: "+251900000004",
         roleId: staffRole.id,
         stateId: state.id,
       },
     });

     // Mercy: prefer explicit certificate override, else robust name matching (handles both variants)
     const mercyCerts = (process.env.MERCY_FELLOWSHIP_CERTS || "")
       .split(",")
       .map((s) => s.trim())
       .filter(Boolean);

     let mercyMatches: { id: string; name: string }[] = [];

     if (mercyCerts.length) {
       const fetched = await prisma.councilFellowship.findMany({
         where: { certificateNo: { in: mercyCerts } },
         select: { id: true, name: true },
       });
       mercyMatches.push(...fetched);
     } else {
       const mercyNames = [
         "አዲስ ቤተ-እመነት", // variant 1
         "አዲስ ቤተ-እምነት", // variant 2
       ];
       const mercyTargets = mercyNames.map((n) => ({ raw: n, norm: normalizeCanonical(n), nos: stripAllSpaces(n) }));
       const allFellowshipsForMercy = await prisma.councilFellowship.findMany({ select: { id: true, name: true } });
       const byNormM = new Map<string, { id: string; name: string }[]>();
       const byNoSpaceM = new Map<string, { id: string; name: string }[]>();
       for (const f of allFellowshipsForMercy) {
         const n = normalizeCanonical(f.name);
         const ns = stripAllSpaces(f.name);
         byNormM.set(n, [...(byNormM.get(n) || []), f]);
         byNoSpaceM.set(ns, [...(byNoSpaceM.get(ns) || []), f]);
       }
       for (const t of mercyTargets) {
         let candidates = byNormM.get(t.norm) || [];
         if (candidates.length === 1) { mercyMatches.push(candidates[0]); continue; }
         candidates = byNoSpaceM.get(t.nos) || [];
         if (candidates.length === 1) { mercyMatches.push(candidates[0]); continue; }
       }
     }

     for (const f of mercyMatches) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: mercy.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: mercy.id, fellowshipId: f.id },
       });
     }
     // Remove any stale links not in the target set (enforce exact scope)
     if (mercyMatches.length > 0) {
       const keepIds = new Set(mercyMatches.map((f) => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: mercy.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter((l) => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: mercy.id, fellowshipId: { in: toRemove.map((x) => x.fellowshipId) } },
         });
       }
     }

    // 6) Upsert Gezu as restricted Staff and scope to all council fellowships
     const gezuEmail = "gezuabiy@gmail.com";
     const gezuPlain = process.env.GEZU_PASSWORD || "@Gezu#Abi!841#";
     const gezuHashed = await bcrypt.hash(gezuPlain, 10);
     const gezu = await prisma.staff.upsert({
       where: { email: gezuEmail },
       update: {
         firstName: "Gezu",
         lastName: "Abiy",
         fullName: "Gezu Abiy",
         password: gezuHashed,
         phoneNumber: "+251900000000",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: gezuEmail,
         firstName: "Gezu",
         lastName: "Abiy",
         fullName: "Gezu Abiy",
         password: gezuHashed,
         phoneNumber: "+251900000000",
         roleId: staffRole.id,
         stateId: state.id,
       },
     });

     const gezuMatches = await prisma.councilFellowship.findMany({
       select: { id: true, name: true },
     });
     for (const f of gezuMatches) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: gezu.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: gezu.id, fellowshipId: f.id },
       });
     }
     // Remove any stale links not in the target set (enforce exact scope)
     if (gezuMatches.length > 0) {
       const keepIds = new Set(gezuMatches.map(f => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: gezu.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter(l => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: gezu.id, fellowshipId: { in: toRemove.map(x => x.fellowshipId) } },
         });
       }
     }

     // 7) Upsert Saron Fekadu as restricted Staff
     const saronEmail = "saronbegna@gmail.com";
     const saronPlain = process.env.SARON_PASSWORD || "Saron!#123@";
     const saronHashed = await bcrypt.hash(saronPlain, 10);
     const saron = await prisma.staff.upsert({
       where: { email: saronEmail },
       update: {
         firstName: "Saron",
         lastName: "Fekadu",
         fullName: "Saron Fekadu",
         password: saronHashed,
         phoneNumber: "+251900000005",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: saronEmail,
         firstName: "Saron",
         lastName: "Fekadu",
         fullName: "Saron Fekadu",
         password: saronHashed,
         phoneNumber: "+251900000005",
         roleId: staffRole.id,
         stateId: state.id,
       },
     });

     const saronFellowshipNames = [
       "አዲስ ቤተ-እምነት",
     ];
     const saronTargets = saronFellowshipNames.map(n => ({ raw: n, norm: normalizeCanonical(n), nos: stripAllSpaces(n) }));
     const allFellowshipsForSaron = await prisma.councilFellowship.findMany({ select: { id: true, name: true } });
     const byNormS = new Map<string, { id: string; name: string }[]>();
     const byNoSpaceS = new Map<string, { id: string; name: string }[]>();
     for (const f of allFellowshipsForSaron) {
       const n = normalizeCanonical(f.name);
       const ns = stripAllSpaces(f.name);
       byNormS.set(n, [...(byNormS.get(n) || []), f]);
       byNoSpaceS.set(ns, [...(byNoSpaceS.get(ns) || []), f]);
     }

     const saronMatches: { id: string; name: string }[] = [];
     const saronMissing: string[] = [];
     for (const t of saronTargets) {
       let candidates = byNormS.get(t.norm) || [];
       if (candidates.length === 1) { saronMatches.push(candidates[0]); continue; }
       candidates = byNoSpaceS.get(t.nos) || [];
       if (candidates.length === 1) { saronMatches.push(candidates[0]); continue; }
       saronMissing.push(t.raw);
     }
     if (saronMissing.length) {
       console.warn("[Seeder] Saron missing fellowships:", saronMissing);
     }
     for (const f of saronMatches) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: saron.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: saron.id, fellowshipId: f.id },
       });
     }
     
     if (saronMatches.length > 0) {
       const keepIds = new Set(saronMatches.map(f => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: saron.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter(l => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: saron.id, fellowshipId: { in: toRemove.map(x => x.fellowshipId) } },
         });
       }
     }

     // 8) Upsert Bekele Bersha as restricted Staff
     const bekeleEmail = "bekelebersha@gmail.com";
     const bekelePlain = process.env.BEKELE_PASSWORD || "Bekele@123!";
     const bekeleHashed = await bcrypt.hash(bekelePlain, 10);
     const bekele = await prisma.staff.upsert({
       where: { email: bekeleEmail },
       update: {
         firstName: "Bekele",
         lastName: "Bersha",
         fullName: "Bekele Bersha",
         password: bekeleHashed,
         phoneNumber: "+251900000006",
         roleId: staffRole.id,
         stateId: state.id,
       },
       create: {
         email: bekeleEmail,
         firstName: "Bekele",
         lastName: "Bersha",
         fullName: "Bekele Bersha",
         password: bekeleHashed,
         phoneNumber: "+251900000006",
         roleId: staffRole.id,
         stateId: state.id,
       },
     });

     const bekeleFellowshipNames = [
       "የውጭ አገራት ሚኒስትሪዎች እና ቤተ እምነቶች",
     ];
     const bekeleTargets = bekeleFellowshipNames.map(n => ({ raw: n, norm: normalizeCanonical(n), nos: stripAllSpaces(n) }));
     const allFellowshipsForBekele = await prisma.councilFellowship.findMany({ select: { id: true, name: true } });
     const byNormB = new Map<string, { id: string; name: string }[]>();
     const byNoSpaceB = new Map<string, { id: string; name: string }[]>();
     for (const f of allFellowshipsForBekele) {
       const n = normalizeCanonical(f.name);
       const ns = stripAllSpaces(f.name);
       byNormB.set(n, [...(byNormB.get(n) || []), f]);
       byNoSpaceB.set(ns, [...(byNoSpaceB.get(ns) || []), f]);
     }

     const bekeleMatches: { id: string; name: string }[] = [];
     const bekeleMissing: string[] = [];
     for (const t of bekeleTargets) {
       let candidates = byNormB.get(t.norm) || [];
       if (candidates.length === 1) { bekeleMatches.push(candidates[0]); continue; }
       candidates = byNoSpaceB.get(t.nos) || [];
       if (candidates.length === 1) { bekeleMatches.push(candidates[0]); continue; }
       bekeleMissing.push(t.raw);
     }
     if (bekeleMissing.length) {
       console.warn("[Seeder] Bekele missing fellowships:", bekeleMissing);
     }
     for (const f of bekeleMatches) {
       await prisma.staffFellowship.upsert({
         where: { staffId_fellowshipId: { staffId: bekele.id, fellowshipId: f.id } },
         update: {},
         create: { staffId: bekele.id, fellowshipId: f.id },
       });
     }

     if (bekeleMatches.length > 0) {
       const keepIds = new Set(bekeleMatches.map(f => f.id));
       const existingLinks = await (prisma as any).staffFellowship.findMany({
         where: { staffId: bekele.id },
         select: { fellowshipId: true },
       });
       const toRemove = (existingLinks as Array<{ fellowshipId: string }>).filter(l => !keepIds.has(l.fellowshipId));
       if (toRemove.length) {
         await prisma.staffFellowship.deleteMany({
           where: { staffId: bekele.id, fellowshipId: { in: toRemove.map(x => x.fellowshipId) } },
         });
       }
     }
   }
 }
