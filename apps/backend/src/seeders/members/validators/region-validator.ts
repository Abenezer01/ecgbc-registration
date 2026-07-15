export const validateRegion = async (region: string, row: number) => {
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
    "ቤኒሻንጉል ክልል"
  ];

  if (validRegionTypes.includes(region)) return true;

  throw new Error(`region: ${region} not found at row ${row}`);
};
