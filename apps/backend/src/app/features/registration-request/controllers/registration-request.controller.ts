import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../../config/db.config';
import AppError from '../../../shared/errors/app.error';
import { logActivity, ActivityAction, ActivityEntity } from "../../../shared/services/activity.service";
import { CommonObjectState } from '../../data-lookup/enums/data-lookup.enum';

// POST /api/v1/registration-requests/public/apply
export const submitRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      nameAm, nameEn, certificateNo, certificateIssuedDate,
      typeId, councilFellowshipId, regionId, isInEthiopia, country,
      city, subcity, zone, district, houseNumber, phoneNumber, email, poBoxNumber,
      contactPersonName, contactPersonPhone, contactPersonEmail
    } = req.body;

    if (!nameAm || !typeId || !regionId || !phoneNumber || !contactPersonName || !contactPersonPhone) {
      throw new AppError("Missing required fields. Please ensure Church Name, Type, Region, Phone, and Contact Person details are provided.", 400);
    }

    const request = await prisma.registrationRequest.create({
      data: {
        nameAm,
        nameEn,
        certificateNo,
        certificateIssuedDate: certificateIssuedDate ? new Date(certificateIssuedDate) : null,
        typeId,
        councilFellowshipId: councilFellowshipId || null,
        regionId,
        isInEthiopia: isInEthiopia === 'false' ? false : true,
        country: country || 'Ethiopia',
        city,
        subcity,
        zone,
        district,
        houseNumber,
        phoneNumber,
        email,
        poBoxNumber,
        contactPersonName,
        contactPersonPhone,
        contactPersonEmail,
        status: 'PENDING',
      },
    });

    const memberFiles = req.body.memberFiles || [];
    for (const file of memberFiles) {
      await (prisma as any).file.create({
        data: {
          registrationRequestId: request.id,
          fileName: file.fileName,
          file: file.file || "",
          ...(file.categoryId ? { categoryId: file.categoryId } : {}),
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/registration-requests
export const getRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: String(status) } : {};
    
    const requests = await (prisma as any).registrationRequest.findMany({
      where: filter,
      include: {
        type: true,
        region: true,
        councilFellowship: true,
        reviewer: true,
        files: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/registration-requests/:id
export const getRegistrationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const request = await (prisma as any).registrationRequest.findUnique({
      where: { id },
      include: {
        type: true,
        region: true,
        councilFellowship: true,
        reviewer: true,
        files: { include: { category: true } }
      }
    });
    
    if (!request) {
      throw new AppError('Registration request not found', 404);
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/registration-requests/:id/approve
export const approveRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { 
      councilFellowshipId, 
      certificateNo,
      nameAm,
      nameEn,
      typeId,
      regionId,
      email,
      phoneNumber,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone
    } = req.body;
    const staffId = (req as any).staff?.id as string | undefined;
    
    const request = await (prisma as any).registrationRequest.findUnique({ 
      where: { id },
      include: { files: true }
    });
    if (!request) throw new AppError('Registration request not found', 404);
    if (request.status !== 'PENDING') throw new AppError(`Cannot approve a request that is already ${request.status}`, 400);

    const finalFellowshipId = request.councilFellowshipId || councilFellowshipId;
    if (!finalFellowshipId) {
      throw new AppError('A Council Fellowship must be assigned before approving this registration.', 400);
    }

    const finalNameAm = nameAm || request.nameAm;
    const finalNameEn = nameEn !== undefined ? nameEn : request.nameEn;
    const finalTypeId = typeId || request.typeId;
    const finalRegionId = regionId || request.regionId;
    const finalEmail = email !== undefined ? email : request.email;
    const finalPhone = phoneNumber || request.phoneNumber;
    const finalContactName = contactPersonName || request.contactPersonName;
    const finalContactEmail = contactPersonEmail !== undefined ? contactPersonEmail : request.contactPersonEmail;
    const finalContactPhone = contactPersonPhone || request.contactPersonPhone;

    // Check for name uniqueness before starting the transaction to give a clean error
    const existingByName = await prisma.member.findUnique({ where: { name: finalNameAm } });
    if (existingByName) {
      throw new AppError(`A member named "${finalNameAm}" already exists. Please edit the application name before approving.`, 409);
    }

    const finalCertNo = certificateNo || request.certificateNo || `TEMP-${Date.now()}`;

    // Check cert number uniqueness
    const existingByCert = await prisma.member.findUnique({ where: { certificateNo: finalCertNo } });
    if (existingByCert && !finalCertNo.startsWith('TEMP-')) {
      throw new AppError(`Certificate number "${finalCertNo}" is already assigned to another member.`, 409);
    }

    const defaultState = await prisma.dataLookup.findFirst({
      where: { value: CommonObjectState.ACTIVE }
    });
    if (!defaultState) throw new AppError('Member state ACTIVE not found in data lookups', 500);

    // Pre-check ChurchUser email uniqueness before starting the transaction
    const userEmail = finalContactEmail || finalEmail;
    if (userEmail) {
      const existingUser = await prisma.churchUser.findUnique({ where: { email: userEmail } });
      if (existingUser) {
        throw new AppError(
          `A Church Portal account already exists with email "${userEmail}". ` +
          `If this is a re-submission, please reject the duplicate or use a different contact email.`,
          409
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the member
      const member = await tx.member.create({
        data: {
          name: finalNameAm,
          nameEn: finalNameEn,
          certificateNo: finalCertNo,
          certificateIssuedDate: request.certificateIssuedDate || new Date(),
          isInEthiopia: request.isInEthiopia,
          country: request.country,
          city: request.city,
          subcity: request.subcity,
          zone: request.zone,
          district: request.district,
          houseNumber: request.houseNumber,
          phoneNumber: finalPhone,
          poBoxNumber: request.poBoxNumber,
          email: finalEmail,
          typeId: finalTypeId,
          regionId: finalRegionId,
          councilFellowshipId: finalFellowshipId,
          stateId: defaultState.id,
          currentActionState: 'ACTIVE',
          isActive: true
        }
      });

      // Create contact person
      await tx.contactPerson.create({
        data: {
          fullName: finalContactName,
          phoneNumber: finalContactPhone,
          email: finalContactEmail,
          memberId: member.id
        }
      });

      // Generate ChurchUser
      const accountEmail = finalContactEmail || finalEmail || `admin_${Date.now()}@church.ecgbc.org`;
      const hashedPassword = await bcrypt.hash("Password@123", 10);
      
      const parts = finalContactName.split(" ");
      const firstName = parts[0] || "Church";
      const lastName = parts.slice(1).join(" ") || "Admin";

      const churchUser = await tx.churchUser.create({
        data: {
          firstName,
          lastName,
          email: accountEmail,
          phone: finalContactPhone,
          password: hashedPassword,
          role: "ADMIN",
          memberId: member.id
        }
      });

      // Mark request as APPROVED
      const updatedReq = await tx.registrationRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: staffId,
          reviewedAt: new Date()
        }
      });

      // Auto-create initial REGISTERED action state
      if (staffId) {
        await (tx as any).actionState.create({
          data: {
            entityType: "MEMBER",
            entityId: member.id,
            state: "REGISTERED",
            note: "Approved from public registration request",
            performedBy: staffId,
          },
        });
      }

      // Transfer files to the new member
      if (request.files && request.files.length > 0) {
        await (tx as any).file.updateMany({
          where: { registrationRequestId: request.id },
          data: { 
            memberId: member.id,
            councilFellowshipId: finalFellowshipId
          }
        });
      }

      return { member, churchUser, updatedReq };
    });

    if (staffId) {
      await logActivity({
        action: ActivityAction.CREATE,
        entity: ActivityEntity.MEMBER,
        entityId: result.member.id,
        description: `Approved application and created member ${result.member.name}`,
        metadata: { source: 'RegistrationRequest', requestId: id },
      }, req);
    }

    res.json({
      success: true,
      message: 'Application approved, member created, and Church Portal credentials generated',
      data: result
    });
  } catch (error) {
    console.error('[approveRegistration] ERROR:', error);
    next(error);
  }
};

// POST /api/v1/registration-requests/:id/reject
export const rejectRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const staffId = (req as any).staff?.id as string | undefined;

    if (!remark) {
      throw new AppError('Remark is required when rejecting', 400);
    }

    const request = await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        remark,
        reviewedBy: staffId,
        reviewedAt: new Date()
      }
    });

    if (staffId) {
      await logActivity({
        action: ActivityAction.UPDATE,
        entity: ActivityEntity.MEMBER, // Using MEMBER to map it generally
        entityId: id,
        description: `Rejected registration application ${request.nameAm}`,
        metadata: { source: 'RegistrationRequest', remark },
      }, req);
    }

    res.json({
      success: true,
      message: 'Application rejected successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};
