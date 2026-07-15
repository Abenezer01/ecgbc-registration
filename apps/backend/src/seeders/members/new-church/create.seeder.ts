import path from "path";
import readXlsxFile from "read-excel-file/node";
import prisma from "../../../app/config/db.config";
import { CouncilFellowship, DataLookup } from "@prisma/client";
import {
  CommonObjectState,
  MemberType,
  Region,
} from "../../../app/features/data-lookup/enums/data-lookup.enum";
import { ReportStatus } from "../../../app/features/report/enums/report-status.enum";
import { validateMemberType } from "../validators/member-type-validator";
import { validateRegion } from "../validators/region-validator";
import { validateMemberCertificate } from "../validators/member-certificate-validator";
import { validateMemberReport } from "../validators/member-report-validator";
import { log } from "console";
import { getMemberRegion } from "../helpers/member-region.helper";
import { ethToGreg } from "../helpers/ethiopian-date.helper";
import { getReportStatus } from "../helpers/member-report.helper";
import { formattedEthiopianPhoneNumber } from "../helpers/ethiopian-number.helper";
import { randomInt } from "crypto";
import { getMemberType } from "../helpers/member-type.helper";

export type XLSXRow = [
  number, //0 ተ.ቁ
  string, //1 church name
  string, //2 member type
  string, //3 region
  string, //4 city
  string, //5 boardMember Name
  string, //6 boardMember Phone
  string, //7 certificateIssued Date
  number, //8 certificate Number
  number | string, //9 2014 report status
  number | string, //10 2015 report status
  number | string, //11 2016 report status
  number | string, //12 2014 crv
  number | string, //13 2015 crv
  number | string, //14 2016 crv
  string, //16 2014 remark
  string, //17 2015 remark
  string //18 2016 remark
];
export type XLSXData = Array<XLSXRow>;
interface NewMember {
  no: number;
  name: string;
  type: DataLookup;
  region: DataLookup;
  city: string;
  certificateNo: string;
  certificateIssuedDate: Date;
  boardMembers: BoardMember[];
  reports: Report[];
}

interface BoardMember {
  fullName: string;
  phoneNumber: string;
}

interface Report {
  year: number;
  statusId: string;
  crv: string;
  remark: string;
}
export const seedMembers = async (): Promise<any> => {
  console.log('starting seedMembers for new church');
  
  const data: XLSXData = (await readXlsxFile(
    path.join(__dirname, "new_church.xlsx")
  )) as unknown as XLSXData;
  log(`totalRows : `, data.length);

  // Preload existing certificateNos to avoid collisions when generating
  const existingCertRows = await prisma.member.findMany({ select: { certificateNo: true } });
  const existingCerts = new Set(existingCertRows.map(r => r.certificateNo));
  const sessionCerts = new Set<string>();
  const genUniqueCert = (seedNo: number) => {
    let base = 900000 + (Number.isFinite(seedNo) ? seedNo : 0);
    let candidate = base.toString();
    let bump = 0;
    while (existingCerts.has(candidate) || sessionCerts.has(candidate)) {
      bump += 1;
      candidate = (base + bump).toString();
    }
    sessionCerts.add(candidate);
    return candidate;
  };

  const reportedStatus = (await prisma.dataLookup.findUnique({
    where: { value: ReportStatus.REPORTED },
  })) as unknown as DataLookup;
  const notReportedStatus = (await prisma.dataLookup.findUnique({
    where: { value: ReportStatus.NOT_REPORTED },
  })) as unknown as DataLookup;

  let members: NewMember[] = [];
  let lastRow = 0;
  let firstTime = true;
  for (const row of data.slice(3)) {
    if (firstTime) {
      console.log(`first row`);
      console.log(row);
    }
    firstTime = false;
    validateRow(row);
    try {
      if (row[0] !== null) {
        lastRow = row[0];
        const region = await getMemberRegion(row[3]);
        // Determine type from the provided column; if missing or unrecognized, infer from the name
        let type: DataLookup;
        try {
          type = await getMemberType(row[2]);
        } catch {
          type = await getMemberType(row[1]);
        }
        members.push({
          no: row[0],
          name: row[1],
          type,
          region,
          city: row[4],
          certificateIssuedDate: row[7] === null ? new Date() : ethToGreg(row[7], row[0]),
          certificateNo: row[8] === null ? genUniqueCert(row[0]) : row[8].toString(),
          boardMembers: [],
          reports: [],
        });
        if (row[1] !== null) {
          const reportStatus2014 = await getReportStatus(row[9]);
          const reportStatus2015 = await getReportStatus(row[10]);
          const reportStatus2016 = await getReportStatus(row[11]);
          const reports: Report[] = [
            {
              year: 2014,
              statusId: reportStatus2014.id,
              crv: row[12] ? row[12].toString() : "",
              remark: row[15] ? row[15].toString() : "",
            },
            {
              year: 2015,
              statusId: reportStatus2015.id,
              crv: row[13] ? row[13].toString() : "",
              remark: row[16] ? row[16].toString() : "",
            },
            {
              year: 2016,
              statusId: reportStatus2016.id,
              crv: row[14] ? row[14].toString() : "",
              remark: row[17] ? row[17].toString() : "",
            },
          ];
          members = members.map((member) => {
            if (member.no === lastRow && row[5] !== null) {
              return {
                ...member,
                boardMembers: [
                  ...member.boardMembers,
                  {
                    fullName: row[5],
                    phoneNumber: row[6]
                      ? formattedEthiopianPhoneNumber(row[6].toString())
                      : "",
                  },
                ],
                reports,
              };
            }
            return member;
          });
        }
      } else {
        members = members.map((member) => {
          if (member.no === lastRow && row[5] !== null) {
            return {
              ...member,
              boardMembers: [
                ...member.boardMembers,
                {
                  fullName: row[5],
                  phoneNumber: row[6]
                    ? formattedEthiopianPhoneNumber(row[6].toString())
                    : "",
                },
              ],
            };
          }
          return member;
        });
      }
    } catch (error) {
      console.log("error in this row", row);
      console.log(error);
    }
  }
  const state = (await prisma.dataLookup.findUnique({
    where: { value: CommonObjectState.ACTIVE },
  })) as unknown as DataLookup;
 
  const targetFellowshipName = "አዲስ ቤተ-እመነት";
  let fellowhip = await prisma.councilFellowship.findUnique({ where: { name: targetFellowshipName } });
  if (!fellowhip) {
    fellowhip = await prisma.councilFellowship.create({
      data: {
        name: targetFellowshipName,
        certificateNo: randomInt(1000, 9999).toString(),
        certificateIssuedDate: new Date(),
        isInEthiopia: true,
      },
    });
    console.log(`Created council fellowship`, fellowhip?.name, fellowhip?.certificateNo);
  } else {
    console.log(`Using existing council fellowship`, fellowhip?.name, fellowhip?.certificateNo);
  }
  console.log(`council fellowhsip `, fellowhip?.name);

  await Promise.all(
    members.map(async (member) => {
      try {
        await prisma.member.create({
          data: {
            name: member.name,
            certificateNo: member.certificateNo,
            certificateIssuedDate: member.certificateIssuedDate,
            country: "Ethiopia",
            regionId: member.region.id,
            city: member.city,
            councilFellowshipId: fellowhip.id,
            stateId: state.id,
            typeId: member.type.id,
            boardMembers: {
              create: member.boardMembers.map((bm) => ({
                ...bm,
              })),
            },
            reports: {
              create: member.reports.map((r) => ({
                ...r,
              })),
            },
            isInEthiopia: true,
          },
        });
      } catch (error: any) {
        const metaTarget = error?.meta?.target || '';
        let newName = member.name;
        let newCert = member.certificateNo;
        let changed = false;
        if (metaTarget.includes('Member_certificateNo_key')) {
          newCert = genUniqueCert(member.no);
          changed = true;
        }
        if (metaTarget.includes('Member_name_key')) {
          newName = `${member.name} (${member.no})`;
          changed = true;
        }
        if (changed) {
          try {
            await prisma.member.create({
              data: {
                name: newName,
                certificateNo: newCert,
                certificateIssuedDate: member.certificateIssuedDate,
                country: "Ethiopia",
                regionId: member.region.id,
                city: member.city,
                councilFellowshipId: fellowhip.id,
                stateId: state.id,
                typeId: member.type.id,
                boardMembers: { create: member.boardMembers.map((bm) => ({ ...bm })) },
                reports: { create: member.reports.map((r) => ({ ...r })) },
                isInEthiopia: true,
              },
            });
            return;
          } catch (e) {
            console.error(`Retry failed for member: ${member.name} (row ${member.no})`, e);
          }
        }
        console.error(`Error creating member: ${member.name} (Certificate No: ${member.certificateNo})`, error);
      }
    })
  );
};

async function validateRow(row: XLSXRow) {
  try {
    if (row[0] !== null) {
      await validateRegion(row[3], row[0]);
    }
  } catch (error) {
    console.log("error in validateRow");
    console.log(error);
  }
}
