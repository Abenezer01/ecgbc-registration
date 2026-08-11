import prisma from "../../app/config/db.config";

const FILE_CATEGORIES = [
  { description: "Certificate and certificate letter", note: "የምስክር ወረቀት እና የምስክር ወረቀት ደብዳቤ", value: "CERTIFICATE_AND_LETTER", index: 1, isRequired: true },
  { description: "Board Members", note: "የቦርድ አባላት", value: "BOARD_MEMBERS", index: 2, isRequired: false },
  { description: "Bylaw", note: "መተዳደሪያ ደንብ", value: "BYLAW", index: 3, isRequired: false },
  { description: "Minutes", note: "ቃለ ጉባኤ", value: "MINUTES", index: 4, isRequired: false },
  { description: "ID", note: "መታወቂያ", value: "ID", index: 5, isRequired: false },
  { description: "Others", note: "ሌሎች", value: "OTHERS", index: 6, isRequired: false },
];

export const seedFileCategories = async (): Promise<void> => {
  console.log("Seeding file categories (Document Types)...");
  await Promise.all(
    FILE_CATEGORIES.map((cat) =>
      prisma.dataLookup.upsert({
        where: { value: cat.value },
        update: { description: cat.description, note: cat.note, index: cat.index, isRequired: cat.isRequired, type: "Document Type", category: "FILE_TYPE" },
        create: {
          type: "Document Type",
          description: cat.description,
          value: cat.value,
          category: "FILE_TYPE",
          index: cat.index,
          isDefault: false,
          note: cat.note,
          isRequired: cat.isRequired,
        },
      })
    )
  );
  console.log(`Seeded ${FILE_CATEGORIES.length} file categories (Document Types).`);
};
