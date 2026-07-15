import { XLSXRow } from "../create.seeder";

export const validateMemberReport = async (row: XLSXRow) => {
  const memberReport2014 = row[9];
  const memberReport2015 = row[10];
  const memberReport2016 = row[11];
  const validReportTypes = [1, 0, "1", "0", null];
  // console.log(`${row[3]} at row ${row[1]}`);
  if (
    validReportTypes.includes(memberReport2014) &&
    validReportTypes.includes(memberReport2015) &&
    validReportTypes.includes(memberReport2016)
  )
    return true;
  //   console.log(`row`);
  //   console.log(row);

  throw new Error(
    `Invalid report status [${memberReport2014} , ${memberReport2015} , ${memberReport2016}] at row ${row[0]}`
  );
};
