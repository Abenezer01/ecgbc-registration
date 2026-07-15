
import { CouncilFellowship } from "@prisma/client";
import prisma from "../../../app/config/db.config";

export const deleteMembers = async (): Promise<any> => {
  

  const fellowhip = (await prisma.councilFellowship.findUnique({
    where: {
      certificateNo: "00218",
    },
  })) as unknown as CouncilFellowship;
  console.log(`council fellowhsip `, fellowhip?.name);
await prisma.member.deleteMany({
    where: {
      councilFellowshipId: fellowhip.id,
    },
  });
  return fellowhip;
};


