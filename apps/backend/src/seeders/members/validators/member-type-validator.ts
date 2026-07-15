export const validateMemberType = async (memberType: string, row: number) => {
  const validMemberTypes = ["ቤተክርስቲያን", "ሚኒስትሪ"];
  // console.log(`${row[3]} at row ${row[1]}`);
  if (validMemberTypes.includes(memberType)) return true;

  throw new Error(`memberType ${memberType} not found at row ${row}`);
};
