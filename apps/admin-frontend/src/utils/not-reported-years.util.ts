import { Report } from "../types/model/report.model";
import { getCurrentEthYear, getEthipianYear } from "./date-util";

export const getUnReportedYears = (reports: Report[],memberCertificateIssuedDate:string) => {
  const startYear =getEthipianYear(memberCertificateIssuedDate);
  const currentYear =getCurrentEthYear();
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  );
  const unReportedYears = years.filter((year) => {
    const report = reports.find((report) => report.year === year);
    return !report; // Only include years with NO reports at all
  });
  return unReportedYears;
};
