import { XLSXRow } from "../create.seeder";

export const validateRegion = async (row: XLSXRow) => {
  const region = row[3];
  const validRegionTypes = [
    "አዲስ አበባ",
    "ኦሮሚያ ክልል",
    "አማራ ክልል",
    "ትግራይ ክልል",
    "ድሬደዋ",
    "ሲዳማ ክልል",
    "ጋምቤላ ክልል",
    "ደቡብ ኢትዮጵያ ክልል",
    "አፋር  ክልል",
    "ሶማሌ  ክልል",
    "ደቡብ ምዕራብ ኢትዮጵያ ክልል",
    "ሐረር",
    "ማዕከላዊ ኢትዮጵያ ክልል",
  ];

  console.log("row[3] ", row[3]);
  if (validRegionTypes.includes(region)) return true;
  console.log(`row`);
  console.log(row);

  throw new Error(`region: ${region} not found at row ${row[0]}`);
};
