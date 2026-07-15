import { NextFunction, Request, Response } from "express";
import { RoleType } from "../enums/role-type.enum";
import { GetRolesQueryParams } from "../interfaces/query-params.interface";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import { CommonObjectState } from "../../data-lookup/enums/data-lookup.enum";
import { DataLookup } from "@prisma/client";
import { sendSuccessResponse, sendPaginatedResponse } from "../../../shared/helpers/response.helper";


export const getRoles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query as unknown as GetRolesQueryParams;
    const page = query._page || 1 ;
    const limit = query._limit || 5;
    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([prisma.role.findMany({
        where:{},
        include:{permissions:true,},
        take: limit,
        skip,
    }),prisma.role.count({
        where:{},
        take: limit,
        skip,
    })])
    sendPaginatedResponse(res, { roles }, { page, limit, total });
  }
);

export const getRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = await prisma.role.findUnique({
      where: {
        id: req.params.id,
      },
      include:{}
    });

    if (!role) {
      return next(
        new AppError(`Role with ID ${req.params.id} does not exist`, 400)
      );
    }

    sendSuccessResponse(res, { role });
  }
);

export const createRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {name,description,permissions}= req.body;
    const state = (await prisma.dataLookup.findUnique({
        where:{value:CommonObjectState.ACTIVE}
    })) as unknown as DataLookup
    const type =( await prisma.dataLookup.findUnique({
        where:{value:RoleType.CUSTOM}
    })) as unknown as DataLookup

   

    const role = await prisma.role.create({
        data:{
          name:name,
          description:description,
          stateId:state.id,
          typeId:type.id,
          permissions: {
            connect:
              permissions.map((permission: string)=>({
                id:permission
              }))
            
          }
        },
        include:{permissions:true}
    })

    sendSuccessResponse(res, { role });
  }
);


export const updateRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {name,description,permissions}= req.body;
    let role = await prisma.role.findUnique({where:{id:req.params.id},include:{permissions:true}})
    if (!role) {
      return next(
        new AppError(`Role with ID ${req.params.id} does not exist`, 400)
      );
    }
    const existingPermissions = role.permissions.map(permission => permission.id) || [];
    const permissionsToAdd = permissions.filter((permissionId: string) => !existingPermissions.includes(permissionId));
    const permissionsToRemove = existingPermissions.filter(permissionId => !permissions.includes(permissionId));

    let updatedData:any = {}
    if(name) updatedData.name = name;
    if(description) updatedData.description = description;
   
     role = await prisma.role.update({where:{id:req.params.id}, data:{
      permissions:{
        connect: permissionsToAdd.map((permissionId: string) => ({ id: permissionId })), 
        disconnect: permissionsToRemove.map((permissionId: string) => ({ id: permissionId })), 

      },
      ...updatedData
    },include:{
      permissions:true
    }});

   


    sendSuccessResponse(res, { role });
  }
);
