
import path from "path";
import readXlsxFile from "read-excel-file/node";
import prisma from "../../app/config/db.config";

type XLSXData = Array<[string, string]>;
interface NewPermission {
    codeName: string;
    description: string;
}
export const seedPermissions = async (): Promise<any>=>{

    const data: XLSXData = (await readXlsxFile(
        path.join(__dirname, "data.xlsx")
      )) as unknown as XLSXData;
      const permissions: NewPermission[] = [];
      for (const row of data.slice(1)) {
        permissions.push(
          {codeName: row[0],
            description: ""}
        );
      }
  
      await Promise.all(
        permissions.map(async (permission) => {
          await prisma.permission.upsert({
            where: { codeName: permission.codeName }, // Assuming 'email' is a unique field
            update: {}, // If you don't want to update, keep it empty
            create: {
              codeName: permission.codeName,
              description: permission.description
            },
          });
        })
      );
}

