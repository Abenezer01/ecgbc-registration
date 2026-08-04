import prisma from "../../app/config/db.config";

const BOARD_TITLES = [
  // ── Religious ──────────────────────────────────────────────────────────────
  { description: "Rev.",           note: "ቄስ",         value: "board_title_rev",           index: 1  },
  { description: "Pastor",         note: "ፓስተር",       value: "board_title_pastor",        index: 2  },
  { description: "Prophet",        note: "ነቢይ",        value: "board_title_prophet",       index: 3  },
  { description: "Apostle",        note: "ሐዋርያ",       value: "board_title_apostle",       index: 4  },
  { description: "Bishop",         note: "ጳጳስ",        value: "board_title_bishop",        index: 5  },
  { description: "Archbishop",     note: "ሊቀ ጳጳስ",     value: "board_title_archbishop",    index: 6  },
  { description: "Deacon",         note: "ዲያቆን",       value: "board_title_deacon",        index: 7  },
  { description: "Elder",          note: "ሽማግሌ",       value: "board_title_elder",         index: 8  },
  { description: "Evangelist",     note: "ወንጌላዊ",      value: "board_title_evangelist",    index: 9  },
  { description: "Missionary",     note: "ሚስዮነሪ",      value: "board_title_missionary",    index: 10 },

  // ── Academic / Professional ────────────────────────────────────────────────
  { description: "Dr.",            note: "ዶ/ር",         value: "board_title_dr",            index: 11 },
  { description: "Prof.",          note: "ፕሮፌሰር",      value: "board_title_prof",          index: 12 },
  { description: "Eng.",           note: "መሐንዲስ",       value: "board_title_eng",           index: 13 },
  { description: "Arch.",          note: "አርክቴክት",      value: "board_title_arch",          index: 14 },
  { description: "Atty.",          note: "ጠበቃ",        value: "board_title_atty",          index: 15 },
  { description: "Accountant",     note: "ሂሳብ ሹም",     value: "board_title_accountant",    index: 16 },

  // ── General honorifics ─────────────────────────────────────────────────────
  { description: "Mr.",            note: "አቶ",          value: "board_title_mr",            index: 17 },
  { description: "Mrs.",           note: "ወ/ሮ",         value: "board_title_mrs",           index: 18 },
  { description: "Ms.",            note: "ወ/ሪት",        value: "board_title_ms",            index: 19 },
  { description: "Hon.",           note: "ክቡር/ት",       value: "board_title_hon",           index: 20 },
];

export const seedBoardTitles = async (): Promise<void> => {
  console.log("Seeding board titles...");
  await Promise.all(
    BOARD_TITLES.map((title) =>
      prisma.dataLookup.upsert({
        where: { value: title.value },
        update: { description: title.description, note: title.note, index: title.index },
        create: {
          type: "board_title",
          description: title.description,
          value: title.value,
          category: "board_title",
          index: title.index,
          isDefault: false,
          note: title.note,
        },
      })
    )
  );
  console.log(`Seeded ${BOARD_TITLES.length} board titles.`);
};
