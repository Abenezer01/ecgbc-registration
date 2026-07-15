import { ethToGreg } from "../helpers/ethiopian-date.helper";

export const validateMemberCertificate = async (
  memberCertificateIssuedDate: string,
  memberCertificateNo: number,
  row: number
) => {
  const date =  ethToGreg(memberCertificateIssuedDate, row);
  if (memberCertificateIssuedDate && memberCertificateNo) return true;
  //   console.log(`row`);
  //   console.log(row);
 
  

  console.log(`memberCertificateIssuedDate `, memberCertificateIssuedDate);
  console.log(`memberCertificateNo `, memberCertificateNo);
  throw new Error(`Invalid certificate data at row ${row}`);
};
