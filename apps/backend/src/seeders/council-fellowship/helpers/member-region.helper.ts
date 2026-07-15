import { DataLookup, Member } from "@prisma/client";
import { XLSXRow } from "../create.seeder";
import prisma from "../../../app/config/db.config";
import {
  MemberType,
  Region,
} from "../../../app/features/data-lookup/enums/data-lookup.enum";

export const getMemberRegion = async (
  memberRegion: string
): Promise<DataLookup> => {
  console.log("memberRegion", memberRegion);

  let region = null;
  if (memberRegion == "አዲስ አበባ") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.ADDIS_ABEBA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ኦሮሚያ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.OROMIA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "አማራ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.AMHARA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ድሬደዋ") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.DIREDAWA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ሲዳማ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SIDAMA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ጋምቤላ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.GAMBELLA },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ደቡብ ኢትዮጵያ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SOUTH },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "አፋር ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.AFAR },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ሶማሌ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SOMALE },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ደቡብ ምዕራብ ኢትዮጵያ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SOUTH_WEST },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ሐረር") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SOUTH_WEST },
    })) as unknown as DataLookup;
    return region;
  }
  if (memberRegion == "ማዕከላዊ ኢትዮጵያ ክልል") {
    region = (await prisma.dataLookup.findUnique({
      where: { value: Region.SOUTH_WEST },
    })) as unknown as DataLookup;
    return region;
  }
  throw new Error(`region ${memberRegion} not found`);
};
