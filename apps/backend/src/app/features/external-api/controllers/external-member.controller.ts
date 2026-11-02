import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import {
  toExternalMemberDTO,
  ExternalCertificateVerificationDTO,
} from "../dtos/member.dto";

export const listMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.search as string)?.trim();
    const type = (req.query.type as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const region = (req.query.region as string)?.trim();
    const fellowshipId = (req.query.fellowshipId as string)?.trim();
    const status = ((req.query.status as string)?.toLowerCase() || "active").trim();
    const updatedSince = req.query.updatedSince as string;
    const includeParam = (req.query.include as string)?.toLowerCase() || "";
    const includeLeadership = includeParam.includes("leadership") || includeParam.includes("board");

    // Base WHERE conditions
    const where: any = {};

    // Status filtering
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    } // "all" applies no isActive constraint

    // Text search on name, english name, certificate number, or city
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { certificateNo: { contains: search } },
        { city: { contains: search } },
      ];
    }

    // Fellowship filter
    if (fellowshipId) {
      where.councilFellowshipId = fellowshipId;
    }

    // Member Type filter (supports lookup ID or lookup value code)
    if (type) {
      where.OR = where.OR || [];
      where.type = {
        OR: [{ id: type }, { value: type }, { description: { contains: type } }],
      };
    }

    // Category filter
    if (category) {
      where.memberCategory = {
        OR: [{ id: category }, { value: category }, { description: { contains: category } }],
      };
    }

    // Region filter
    if (region) {
      where.region = {
        OR: [{ id: region }, { value: region }, { description: { contains: region } }],
      };
    }

    // Incremental Sync / Delta filter
    if (updatedSince) {
      const sinceDate = new Date(updatedSince);
      if (!isNaN(sinceDate.getTime())) {
        where.updatedAt = { gte: sinceDate };
      } else {
        return next(
          new AppError(
            "Invalid 'updatedSince' format. Please provide a valid ISO-8601 date string (e.g. 2026-01-01T00:00:00Z).",
            400
          )
        );
      }
    }

    const [total, members] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          type: true,
          memberCategory: true,
          state: true,
          region: true,
          councilFellowship: true,
          contactPerson: true,
          boardMembers: includeLeadership
            ? {
                include: { title: true },
                where: { isActive: true },
              }
            : false,
        },
      }),
    ]);

    const data = members.map((member) =>
      toExternalMemberDTO(member, { includeLeadership })
    );

    return res.status(200).json({
      status: "success",
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    });
  }
);

export const getMemberById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const includeParam = (req.query.include as string)?.toLowerCase() || "";
    const includeLeadership =
      includeParam.includes("leadership") || includeParam.includes("board");

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        type: true,
        memberCategory: true,
        state: true,
        region: true,
        councilFellowship: true,
        contactPerson: true,
        boardMembers: includeLeadership
          ? {
              include: { title: true },
              where: { isActive: true },
            }
          : false,
      },
    });

    if (!member) {
      return next(new AppError(`Member with ID '${id}' not found.`, 404));
    }

    const data = toExternalMemberDTO(member, { includeLeadership });
    return res.status(200).json({
      status: "success",
      data,
    });
  }
);

export const getMemberByCertificate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { certificateNo } = req.params;
    const includeParam = (req.query.include as string)?.toLowerCase() || "";
    const includeLeadership =
      includeParam.includes("leadership") || includeParam.includes("board");

    const member = await prisma.member.findUnique({
      where: { certificateNo: certificateNo.trim() },
      include: {
        type: true,
        memberCategory: true,
        state: true,
        region: true,
        councilFellowship: true,
        contactPerson: true,
        boardMembers: includeLeadership
          ? {
              include: { title: true },
              where: { isActive: true },
            }
          : false,
      },
    });

    if (!member) {
      return next(
        new AppError(
          `Member with certificate number '${certificateNo}' not found.`,
          404
        )
      );
    }

    const data = toExternalMemberDTO(member, { includeLeadership });
    return res.status(200).json({
      status: "success",
      data,
    });
  }
);

export const verifyCertificate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { certificateNo } = req.params;

    const member = await prisma.member.findUnique({
      where: { certificateNo: certificateNo.trim() },
      include: {
        type: true,
        councilFellowship: true,
        state: true,
      },
    });

    if (!member) {
      const result: ExternalCertificateVerificationDTO = {
        certificateNumber: certificateNo,
        isAuthentic: false,
        status: "NOT_FOUND",
        verifiedAt: new Date().toISOString(),
      };
      return res.status(200).json({
        status: "success",
        data: result,
      });
    }

    let status: "ACTIVE" | "INACTIVE" | "REVOKED" = "ACTIVE";
    if (member.state?.value === "DELETED") {
      status = "REVOKED";
    } else if (!member.isActive) {
      status = "INACTIVE";
    }

    const result: ExternalCertificateVerificationDTO = {
      certificateNumber: member.certificateNo,
      isAuthentic: status === "ACTIVE",
      status,
      churchNameAmharic: member.name,
      churchNameEnglish: member.nameEn || null,
      issuedDate: member.certificateIssuedDate instanceof Date 
        ? member.certificateIssuedDate.toISOString() 
        : new Date(member.certificateIssuedDate).toISOString(),
      fellowshipName: member.councilFellowship?.name || null,
      typeName: member.type?.description || member.type?.value || null,
      verifiedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      status: "success",
      data: result,
    });
  }
);
