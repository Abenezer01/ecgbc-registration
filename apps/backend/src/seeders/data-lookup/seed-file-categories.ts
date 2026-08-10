import prisma from "../../app/config/db.config";

const FILE_CATEGORIES = [
  { description: "Certificate and certificate letter", note: "የምስክር ወረቀት እና የምስክር ወረቀት ደብዳቤ", value: "file_cat_cert", index: 1, isRequired: true },
  { description: "Board Members", note: "የቦርድ አባላት", value: "file_cat_board_members", index: 2, isRequired: false },
  { description: "Bylaw", note: "መተዳደሪያ ደንብ", value: "file_cat_bylaw", index: 3, isRequired: false },
  { description: "Minutes", note: "ቃለ ጉባኤ", value: "file_cat_minutes", index: 4, isRequired: false },
  { description: "ID", note: "መታወቂያ", value: "file_cat_id", index: 5, isRequired: false },
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
