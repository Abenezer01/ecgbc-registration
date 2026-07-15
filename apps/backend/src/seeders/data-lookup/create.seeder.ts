import path from "path";
import readXlsxFile from "read-excel-file/node";
import prisma from "../../app/config/db.config";

type XLSXData = Array<[string, string, string, string, number, string, string]>;
interface NewDataLookup {
  type: string;
  description: string;
  value: string;
  category: string;
  index: number;
  isDefault: boolean;
  note: string;
}
export const seedDataLookups = async (): Promise<any> => {
  const data: XLSXData = (await readXlsxFile(
    path.join(__dirname, "data1.xlsx")
  )) as unknown as XLSXData;
  const dataLookups: NewDataLookup[] = [];
  for (const row of data.slice(1)) {
    dataLookups.push({
      type: row[0],
      description: row[1],
      value: row[2],
      category: row[3],
      index: row[4],
      isDefault: row[5] === "true",
      note: row[6],
    });
  }

  await Promise.all(
    dataLookups.map(async (lookup) => {
      await prisma.dataLookup.upsert({
        where: { value: lookup.value }, // Assuming 'email' is a unique field
        update: {}, // If you don't want to update, keep it empty
        create: {
          type: lookup.type,
          description: lookup.description,
          category: lookup.category,
          value: lookup.value,
          isDefault: lookup.isDefault,
          index: lookup.index,
          note: lookup.note,
        },
      });
    })
  );
};
