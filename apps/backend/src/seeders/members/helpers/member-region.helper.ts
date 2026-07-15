import { DataLookup } from "@prisma/client";
import prisma from "../../../app/config/db.config";
import { Region } from "../../../app/features/data-lookup/enums/data-lookup.enum";

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

const MAP: Array<{ keys: string[]; value: Region }> = [
  { keys: ["አዲስአበባ", "addisababa", "addis"], value: Region.ADDIS_ABEBA },
  { keys: ["ትግራይክልል", "tigray"], value: Region.TIGRAY },
  { keys: ["ኦሮሚያክልል", "oromia"], value: Region.OROMIA },
  { keys: ["አማራክልል", "amhara"], value: Region.AMHARA },
  { keys: ["ድሬደዋ", "dire", "diredawa"], value: Region.DIREDAWA },
  { keys: ["ሲዳማክልል", "sidama"], value: Region.SIDAMA },
  { keys: ["ጋምቤላክልል", "gambella"], value: Region.GAMBELLA },
  { keys: ["ደቡብኢትዮጵያክልል", "southregion", "south"], value: Region.SOUTH },
  { keys: ["አፋርክልል", "afar"], value: Region.AFAR },
  { keys: ["ሶማሌክልል", "somale", "somali"], value: Region.SOMALE },
  { keys: ["ደቡብምዕራብኢትዮጵያክልል", "southwest", "south-west"], value: Region.SOUTH_WEST },
  { keys: ["ሐረር", "harer", "harar"], value: Region.HARER },
  { keys: ["ማዕከላዊኢትዮጵያክልል", "central"], value: Region.CENTRAL },
  { keys: ["ቤኒሻንጉልክልል", "benshangul"], value: Region.BENSHANGUL },
];

export const getMemberRegion = async (memberRegion: string): Promise<DataLookup> => {
  const norm = stripAllSpacesLower(memberRegion);
  const hit = MAP.find(m => m.keys.some(k => norm.includes(k)));
  if (hit) {
    return (await prisma.dataLookup.findUnique({ where: { value: hit.value } })) as unknown as DataLookup;
  }
  throw new Error(`region ${memberRegion} not found`);
};
