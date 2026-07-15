import path from "path";
import readXlsxFile from "read-excel-file/node";
import prisma from "../../app/config/db.config";

import { log } from "console";
import { formattedEthiopianPhoneNumber } from "./helpers/ethiopian-number.helper";
import { ethToGreg } from "./helpers/ethiopian-date.helper";
import { getMemberRegion } from "./helpers/member-region.helper";
import { DataLookup } from "@prisma/client";

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
  number | string, //9 2013 report status
  number | string, //10 2014 report status
  number | string, //11 2015 report status
  number | string, //12 crv
  string //13 remark
];
export type XLSXData = Array<XLSXRow>;

interface NewCouncilFellowship {
  no: number;
  name: string;
  type: string;
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

export const seedCouncilFellowships = async (): Promise<any> => {
  const data: XLSXData = (await readXlsxFile(
    path.join(__dirname, "fellowships.xlsx")
  )) as unknown as XLSXData;
  console.log("total rows", data.length);

  let councilFellowships: NewCouncilFellowship[] = [];
  let lastRow = 0;
  //   log("data");
  //   log(data);
  for (const row of data.slice(4)) {
    try {
      // validateRow(row);
      if (row[0] !== null) {
        // log("row");
        // log(row);
        lastRow = row[0];
        log("lastRow", lastRow);
        const region = await getMemberRegion(row[3]);
        councilFellowships.push({
          no: row[0],
          name: row[1],
          type: row[2],
          region,
          city: row[4],
          certificateIssuedDate: ethToGreg(row[7]),
          certificateNo: row[8].toString(),
          boardMembers: [],
          reports: [],
        });
        if (row[1] !== null) {
          councilFellowships = councilFellowships.map((councilFellowship) => {
            if (
              councilFellowship.no === lastRow &&
              row[5] !== null &&
              row[6] !== null
            ) {
              return {
                ...councilFellowship,
                boardMembers: [
                  ...councilFellowship.boardMembers,
                  {
                    fullName: row[5],
                    phoneNumber: formattedEthiopianPhoneNumber(
                      row[6]?.toString()
                    ),
                  },
                ],
              };
            }
            return councilFellowship;
          });
        }
      } else {
        councilFellowships = councilFellowships.map((councilFellowship) => {
          if (
            councilFellowship.no === lastRow &&
            row[5] !== null &&
            row[6] !== null
          ) {
            return {
              ...councilFellowship,
              boardMembers: [
                ...councilFellowship.boardMembers,
                {
                  fullName: row[5],
                  phoneNumber: formattedEthiopianPhoneNumber(
                    row[6]?.toString()
                  ),
                },
              ],
            };
          }
          return councilFellowship;
        });
      }
    } catch (error) {
      log("error in row");
      log(row);
      log(error);
    }
  }
  // log("councilFellowships");
  // log(councilFellowships);
  try {
    await Promise.all(
      councilFellowships.map(async (councilFellowship) => {
        await prisma.councilFellowship.upsert({
          where: { certificateNo: councilFellowship.certificateNo.toString() }, // Assuming 'email' is a unique field
          update: {}, // If you don't want to update, keep it empty
          create: {
            name: councilFellowship.name,
            certificateNo: councilFellowship.certificateNo,
            certificateIssuedDate: councilFellowship.certificateIssuedDate,
            city: councilFellowship.city,
            boardMembers: {
              create: councilFellowship.boardMembers,
            },
            isInEthiopia: true,
          },
        });
      })
    );
    console.log("councilFellowships created successfully");

    // Ensure “አዲስ ቤተ-እመነት” exists even if not present in the sheet
    const missingName = "አዲስ ቤተ-እመነት";
    const existing = await prisma.councilFellowship.findUnique({ where: { name: missingName } });
    if (!existing) {
      // Generate a unique 4-digit certificate number not used yet
      const used = new Set(
        (
          await prisma.councilFellowship.findMany({ select: { certificateNo: true } })
        ).map((x) => x.certificateNo)
      );
      let candidate = 9001;
      while (used.has(candidate.toString())) candidate++;
      const created = await prisma.councilFellowship.create({
        data: {
          name: missingName,
          certificateNo: candidate.toString(),
          certificateIssuedDate: new Date(),
          isInEthiopia: true,
          city: "Addis Ababa",
        },
      });
      console.log("Ensured missing fellowship created:", created.name, created.certificateNo);
    }
  } catch (error) {
    log("error in upsert councilFellowship");
    log(error);
  }
};

async function validateRow(row: XLSXRow) {
  try {
    // log("row[0] ", row[0]);

    if (row[1] !== null) {
      // await validateMemberType(row);
      // await validateRegion(row);
      // await validateMemberCertificate(row);
      // await validateMemberReport(row);
    }
  } catch (error) {
    log("error in validateRow");
    log(error);
  }
}
