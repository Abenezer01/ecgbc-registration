import { DataLookup } from "@prisma/client";
import prisma from "../../../app/config/db.config";
import { ReportStatus } from "../../../app/features/report/enums/report-status.enum";

export const getReportStatus = async (
  report: string | number
): Promise<DataLookup> => {
  //   console.log("report", report);
  const reportedTypes = [1, "1", "Reported", "REPORTED"];
  const notReportedTypes = [0, "0", "NOT REPORTED"];
  let reportStatus = null;
  if (reportedTypes.includes(report)) {
    reportStatus = (await prisma.dataLookup.findUnique({
      where: { value: ReportStatus.REPORTED },
    })) as unknown as DataLookup;
    return reportStatus;
  }
  //   if (notReportedTypes.includes(report)) {
  reportStatus = (await prisma.dataLookup.findUnique({
    where: { value: ReportStatus.NOT_REPORTED },
  })) as unknown as DataLookup;
  return reportStatus;
  //   }

  //   throw new Error(`report status : ${report} not found`);
};
