import { XLSXRow } from "../create.seeder";

export const validateMemberType = async (row: XLSXRow) => {
  const memberType = row[2];
  const validMemberTypes = ["ቤተክርስቲያን", "ሚኒስትሪ"];
  // console.log(`${row[3]} at row ${row[1]}`);
  if (validMemberTypes.includes(memberType)) return true;
  console.log(`row`);
  console.log(row);

  throw new Error(`memberType ${memberType} not found at row ${row[1]}`);
};
