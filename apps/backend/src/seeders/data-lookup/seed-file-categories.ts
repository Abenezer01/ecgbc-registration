import prisma from "../../app/config/db.config";

const FILE_CATEGORIES = [
  { description: "Registration Certificate", note: "የምዝገባ ምስክር ወረቀት", value: "file_cat_registration_cert", index: 1, isRequired: true },
  { description: "Annual Report", note: "ዓመታዊ ሪፖርት", value: "file_cat_annual_report", index: 2, isRequired: false },
  { description: "Financial Statement", note: "የፋይናንስ መግለጫ", value: "file_cat_financial_statement", index: 3, isRequired: false },
  { description: "Board Resolution", note: "የቦርድ ውሳኔ", value: "file_cat_board_resolution", index: 4, isRequired: false },
  { description: "ID Copy", note: "የመታወቂያ ቅጂ", value: "file_cat_id_copy", index: 5, isRequired: false },
  { description: "Other", note: "ሌላ", value: "file_cat_other", index: 6, isRequired: false },
];

export const seedFileCategories = async (): Promise<void> => {
  console.log("Seeding file categories...");
  await Promise.all(
    FILE_CATEGORIES.map((cat) =>
      prisma.dataLookup.upsert({
        where: { value: cat.value },
        update: { description: cat.description, note: cat.note, index: cat.index, isRequired: cat.isRequired },
        create: {
          type: "file_category",
          description: cat.description,
          value: cat.value,
          category: "file_category",
          index: cat.index,
          isDefault: false,
          note: cat.note,
          isRequired: cat.isRequired,
        },
      })
    )
  );
  console.log(`Seeded ${FILE_CATEGORIES.length} file categories.`);
};
