import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from 'jsonwebtoken'
import { promisify } from "util";
import { cleanEnv, str } from "envalid";
import AppError from "../../../shared/errors/app.error";
import { RolePermission, MemberPermission } from "../../permission/enums/permission.enum";
import { catchAsync } from "../../../config/error.config";
import prisma from "../../../config/db.config";
import { RoleType } from "../../role/enums/role-type.enum";
import { MemberType } from "../../data-lookup/enums/data-lookup.enum";

const env = cleanEnv(process.env, {
  JWT_ACCESS_SECRET_KEY: str(),
  JWT_ACCESS_EXPIRES_IN: str(),
  JWT_REFRESH_SECRET_KEY: str(),
  JWT_REFRESH_EXPIRES_IN: str(),
});

export const verifyStaff = catchAsync(
  async (req: Request, _: Response, next: NextFunction) => {
    let token:string | null = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(new AppError("Your not logged in", 401));
    }

  //Verify token
  
  //@ts-ignore
  const payload = await promisify(jwt.verify)(
    token,
    //@ts-ignore
    env.JWT_ACCESS_SECRET_KEY
  ) as JwtPayload ; 


  const staff = await prisma.staff.findUnique({
    where: {
      id:payload.staff.id,
    },include:{role:{include:{permissions:true,type:true}}}
  });

  if (!staff) {
    return next(
      new AppError("The staff related to the token no longer exists", 401)
    );
  }

  // Special-case: Ephrem should NOT be able to deactivate/restore members
  if (staff.email?.toLowerCase() === "ephibillioner@gmail.com") {
    staff.role.permissions = staff.role.permissions.filter((p:any) => p.codeName !== MemberPermission.MEMBER_DEACTIVATE);
  }

  // Gezu must be strictly read-only across the system
  if (staff.email?.toLowerCase() === "gezuabiy@gmail.com") {
    staff.role.permissions = staff.role.permissions.filter((p: any) =>
      String(p.codeName || "").startsWith("view_")
    );
  }

  // Use a local any-cast to avoid TS complaints while global augmentation stabilizes
  const reqAny = req as any;
  reqAny.staff = staff; // prisma type includes relations; cast to augmented AuthenticatedStaff
  reqAny.isAdminRole = staff.role.type?.value=== RoleType.OWNER;
  // back-compat for legacy request.user usages
  reqAny.user = { email: staff.email };

  // Build base RBAC scope for all non-admin staff
  if (!reqAny.isAdminRole) {
    // Default RBAC container
    const rbac: any = {};

    // Fellowships scope via junction table
    try {
      const links = await (prisma as any).staffFellowship.findMany({
        where: { staffId: staff.id },
        select: { fellowshipId: true },
      });
      rbac.allowedFellowshipIds = (links as Array<{ fellowshipId: string }>).map((l) => l.fellowshipId);
    } catch (_) {
      rbac.allowedFellowshipIds = [];
    }

    // Active-only if staff lacks deactivate permission
    const permissionCodes = staff.role.permissions.map((p) => p.codeName);
    rbac.activeOnly = !permissionCodes.includes(MemberPermission.MEMBER_DEACTIVATE);

    // Entity type constraints for specific scoped staff (Ephrem)
    const email = staff.email.toLowerCase();
    if (email === "ephibillioner@gmail.com") {
      rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
    }
    // Abinet: can see both ministries and churches within assigned fellowships
    if (email === "abateabinet94@gmail.com") {
      rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
    }
    // Chaltu: can see both ministries and churches within assigned fellowships
    if (email === "kiyagudina07@gmail.com") {
      rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
    }
    // Mercy: can see both ministries and churches within assigned fellowships
    if (email === "mehirit2067@gmail.com") {
      rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
    }

    // Gezu: now restricted Staff; allow both MINISTRY & CHURCH, scoped by assigned fellowships only
    if (email === "gezuabiy@gmail.com") {
      rbac.allowedTypeValues = [MemberType.MINISTRY, MemberType.CHURCH];
      // No category-based derivation anymore; scope comes from StaffFellowship links
    }

    reqAny.rbac = rbac;

  }
  next();
  }
);


export const restrictStaff = (permission: string) =>
  catchAsync(async (req: Request, _: Response, next: NextFunction) => {
    if ((req as any).staff) {      
      //@ts-ignore
      const permissions = (req as any).staff.role.permissions.map((permission: RolePermission) => permission.codeName);
      if (!permissions.includes(permission)) {
        return next(
          new AppError("You're not allowed to perform current operation", 403)
        );
      }
    }
    next();
  });

export function restrictToOwner(req: Request, res: Response,next: NextFunction){
  if((req as any).staff?.id != req.params.id) {
    return next(
        new AppError(`You can only update your own profile`, 400)
      );   
      
    }
    next();
}