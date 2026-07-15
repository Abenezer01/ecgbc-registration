import { DataLookup, Member } from "@prisma/client";
import { XLSXRow } from "../create.seeder";
import prisma from "../../../app/config/db.config";
import { MemberType } from "../../../app/features/data-lookup/enums/data-lookup.enum";

export const getMemberType = async (row: XLSXRow): Promise<DataLookup> => {
  let type = null;
  const memberType = row[3];
  if (memberType == "ቤተክርስቲያን") {
    type = (await prisma.dataLookup.findUnique({
      where: { value: MemberType.CHURCH },
    })) as unknown as DataLookup;
    return type;
  }
  if (memberType == "ሚኒስትሪ") {
    type = (await prisma.dataLookup.findUnique({
      where: { value: MemberType.MINISTRY },
    })) as unknown as DataLookup;
    return type;
  }
  throw new Error(`memberType ${memberType} not found`);
};
