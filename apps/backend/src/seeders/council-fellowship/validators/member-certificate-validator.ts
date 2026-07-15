import { XLSXRow } from "../create.seeder";

export const validateMemberCertificate = async (row: XLSXRow) => {
  const memberCertificateIssuedDate = row[7];
  const memberCertificateNo = row[8];
  if (memberCertificateIssuedDate && memberCertificateNo) return true;
  //   console.log(`row`);
  //   console.log(row);

  throw new Error(`Invalid certificate data at row ${row[0]}`);
};
