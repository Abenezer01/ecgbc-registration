
import path from "path";
import readXlsxFile from "read-excel-file/node";
import prisma from "../../app/config/db.config";
import { RoleType } from "../../app/features/role/enums/role-type.enum";
import { Permission, Role } from "@prisma/client";
import { RolePermission } from "../../app/features/permission/enums/permission.enum";

type XLSXData = Array<[string, string,string,string]>;
interface NewRolePermission {
    roleId: string;
    permissionId: string;
}
export const seedRolePermissions = async (): Promise<any>=>{

    const data: XLSXData = (await readXlsxFile(
        path.join(__dirname, "data.xlsx")
      )) as unknown as XLSXData;

      const rolePermissions: NewRolePermission[] = [];
const permissions = await prisma.permission.findMany()
      const ownerRole =( await prisma.role.findFirst({
        where:{type:{
            value:RoleType.OWNER
        }}
    })) as unknown as Role;

    const adminRole =( await prisma.role.findFirst({
        where:{type:{
            value:RoleType.ADMIN
        }}
    })) as unknown as Role;

    const lookAdminRole =( await prisma.role.findFirst({
        where:{type:{
            value:RoleType.LOOK_ADMIN
        }}
    })) as unknown as Role;

    for (const row of data.slice(1)) {
        const permission = permissions.find(
          (permission) => permission.codeName === row[0]
        );
        if (row[1] === "✔️") {
         
          
            rolePermissions.push(
            {
                roleId:ownerRole.id,
                permissionId:permission?.id!
            }
          );
        }
  
        if (row[2] === "✔️") {
          rolePermissions.push(
            {
                roleId:adminRole.id,
                permissionId:permission?.id!
            }
          );
        }
        if (row[3] === "✔️") {
          rolePermissions.push(
            {
                roleId:lookAdminRole.id,
                permissionId:permission?.id!
            }
          );
        }
      
      }
  
      await Promise.all(
        rolePermissions.map(async (rolePermission) => {
        
          const role = await prisma.role.findUnique({
            where: { id: rolePermission.roleId },
            include: { permissions: true }, // Include permissions in the query
          });
          const permissionExists = role?.permissions.some(
            (permission) => permission.id === rolePermission.permissionId
          );
          if(!permissionExists){
            
            await prisma.role.update({
              where: {id:rolePermission.roleId },
              data: {
                permissions:{
                  connect:{
                      id:rolePermission.permissionId
                  }
                }
              },
            });
          }
          
        })
      );
}

