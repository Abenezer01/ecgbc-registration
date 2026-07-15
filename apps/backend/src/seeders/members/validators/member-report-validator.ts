export const validateMemberReport = async (
  memberReport2014: string | number,
  memberReport2015: string | number,
  memberReport2016: string | number,
  row: number
) => {
  const validReportTypes = [
    1,
    0,
    "1",
    "0",
    "Reported",
    "NOT REPORTED",
    "REPORTED",
    null
  ];
  // console.log(`${row[3]} at row ${row[1]}`);

  if (
    validReportTypes.includes(memberReport2014) &&
    validReportTypes.includes(memberReport2015) &&
    validReportTypes.includes(memberReport2016)
  )
    return true;
  //   console.log(`row`);
  //   console.log(row);
  console.log(`Invalid report status ${row}`);

  console.log(`memberReport2014 `, memberReport2014);
  console.log(`memberReport2015 `, memberReport2015);
  console.log(`memberReport2016 `, memberReport2016);
  throw new Error(`Invalid report status ${row}`);
};
