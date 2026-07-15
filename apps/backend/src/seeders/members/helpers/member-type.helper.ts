import { DataLookup } from "@prisma/client";
import prisma from "../../../app/config/db.config";
import { MemberType } from "../../../app/features/data-lookup/enums/data-lookup.enum";

function normalizeCanonical(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\t\r\n\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function stripAllSpacesLower(s: string) { return normalizeCanonical(s).replace(/\s+/g, "").toLowerCase(); }

export const getMemberType = async (memberType: string): Promise<DataLookup> => {
  const raw = memberType || "";
  const norm = stripAllSpacesLower(raw);

  const CHURCH_KEYS = new Set([
    stripAllSpacesLower("ቤተክርስቲያን"),
    stripAllSpacesLower("ቤተ ክርስቲያን"),
    stripAllSpacesLower("ቤ/ክርስቲያን"),
    stripAllSpacesLower("church"),
  ]);
  const MINISTRY_KEYS = new Set([
    stripAllSpacesLower("ሚኒስትሪ"),
    stripAllSpacesLower("ሚኒስቴሪ"),
    stripAllSpacesLower("ሚንስትሪ"),
    stripAllSpacesLower("ministry"),
    // Common Amharic variants meaning "Center"
    stripAllSpacesLower("ማእከል"),
    stripAllSpacesLower("ማዕከል"),
    stripAllSpacesLower("ማአከል"),
    stripAllSpacesLower("center"),
  ]);

  if (CHURCH_KEYS.has(norm)) {
    return (await prisma.dataLookup.findUnique({ where: { value: MemberType.CHURCH } })) as unknown as DataLookup;
  }
  if (MINISTRY_KEYS.has(norm)) {
    return (await prisma.dataLookup.findUnique({ where: { value: MemberType.MINISTRY } })) as unknown as DataLookup;
  }

  // Fallback: try simple contains checks on common tokens
  if (norm.includes(stripAllSpacesLower("ቤተ")) || norm.includes("church")) {
    return (await prisma.dataLookup.findUnique({ where: { value: MemberType.CHURCH } })) as unknown as DataLookup;
  }
  if (
    norm.includes("ministry") ||
    norm.includes(stripAllSpacesLower("ሚኒስ")) ||
    norm.includes(stripAllSpacesLower("ማእከል")) ||
    norm.includes(stripAllSpacesLower("ማዕከል")) ||
    norm.includes(stripAllSpacesLower("ማአከል")) ||
    norm.includes("center")
  ) {
    return (await prisma.dataLookup.findUnique({ where: { value: MemberType.MINISTRY } })) as unknown as DataLookup;
  }

  throw new Error(`memberType ${memberType} not found`);
};
