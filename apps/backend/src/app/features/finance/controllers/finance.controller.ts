import { NextFunction, Request, Response } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import AppError from "../../../shared/errors/app.error";
import {
  sendSuccessResponse,
  sendPaginatedResponse,
} from "../../../shared/helpers/response.helper";
import { verifyPaymentWithGateway } from "../services/verification.service";
import { FeeStatus } from "../enums/fee-status.enum";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { previewFee } from "../services/fee-resolver.service";

// ---------------------------------------------------------------------------
// Email helper
// ---------------------------------------------------------------------------
function getMailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendFeeEmail(opts: {
  to: string;
  memberName: string;
  year: number;
  amount: number;
  currency: string;
  feeId: string;
}) {
  if (!process.env.SMTP_USER) return; // skip if email not configured
  
  const baseUrl = process.env.CHURCH_PORTAL_URL || 'https://mychurch.ecgbc.org';
  const verificationUrl = `${baseUrl}/verify-fee/${opts.feeId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#1d4ed8', light: '#FFFFFF' } });

  const transport = getMailTransport();
  await transport.sendMail({
    from: `"ECGBC Finance" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Reporting Fee Invoice — ${opts.year} E.C`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1d4ed8">ECGBC Reporting Fee Invoice</h2>
        <p>Dear <strong>${opts.memberName}</strong>,</p>
        <p>A reporting fee has been issued for your <strong>${opts.year} E.C</strong> annual report.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Fee Amount</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${opts.currency || 'ETB'} ${opts.amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Reference ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${opts.feeId.slice(0, 8).toUpperCase()}</td>
          </tr>
        </table>
        <div style="margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #4b5563;">Scan to Verify Invoice Authenticity</p>
          <img src="${qrCodeDataUrl}" alt="Verification QR Code" style="width: 120px; height: 120px; border: 1px solid #e5e7eb; border-radius: 4px;" />
        </div>
        <p>Please log in to the <strong>ECGBC Church Portal</strong> to view your outstanding fee.</p>
        <p style="color:#6b7280;font-size:12px">If you believe this was sent in error, contact your fellowship coordinator.</p>
      </div>
    `,
  });
}

export async function sendReceiptEmail(opts: {
  to: string;
  memberName: string;
  year: number;
  amount: number;
  currency: string;
  feeId: string;
  crv?: string;
  bankReference?: string;
}) {
  if (!process.env.SMTP_USER) return;

  const baseUrl = process.env.CHURCH_PORTAL_URL || 'https://mychurch.ecgbc.org';
  const verificationUrl = `${baseUrl}/verify-fee/${opts.feeId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#10b981', light: '#FFFFFF' } });

  const transport = getMailTransport();
  await transport.sendMail({
    from: `"ECGBC Finance" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Payment Receipt — ${opts.year} E.C`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#10b981">ECGBC Payment Receipt</h2>
        <p>Dear <strong>${opts.memberName}</strong>,</p>
        <p>Your payment for the <strong>${opts.year} E.C</strong> annual report has been approved and cleared.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Amount Paid</td>
            <td style="padding:8px;border:1px solid #e5e7eb">${opts.currency || 'ETB'} ${opts.amount.toFixed(2)}</td>
          </tr>
          ${opts.crv ? `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">CRV Number</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${opts.crv}</td>
          </tr>` : ''}
          ${opts.bankReference ? `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Bank Reference</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${opts.bankReference}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">Reference ID</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">${opts.feeId.slice(0, 8).toUpperCase()}</td>
          </tr>
        </table>
        <div style="margin: 20px 0; text-align: center;">
          <p style="font-size: 14px; color: #4b5563;">Scan to Verify Receipt Authenticity</p>
          <img src="${qrCodeDataUrl}" alt="Verification QR Code" style="width: 120px; height: 120px; border: 1px solid #e5e7eb; border-radius: 4px;" />
        </div>
        <p>Thank you for your payment.</p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Category Fee Rates
// ---------------------------------------------------------------------------

/** GET /finance/fee-rates — list all category rates */
export const getCategoryFeeRates = catchAsync(
  async (req: Request, res: Response) => {
    const rates = await (prisma as any).categoryFeeRate.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    sendSuccessResponse(res, { rates });
  }
);

/** PUT /finance/fee-rates/:categoryId — create or update a rate for a category */
export const upsertCategoryFeeRate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const { amount, currency, description } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      return next(new AppError("A valid positive amount is required", 400));
    }

    const category = await prisma.dataLookup.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return next(new AppError(`Category with ID ${categoryId} not found`, 404));
    }

    const rate = await (prisma as any).categoryFeeRate.upsert({
      where: { categoryId },
      update: { amount: Number(amount), currency: currency || "ETB", description: description || null },
      create: {
        categoryId,
        amount: Number(amount),
        currency: currency || "ETB",
        description: description || null,
      },
      include: { category: true },
    });

    sendSuccessResponse(res, { rate });
  }
);

// ---------------------------------------------------------------------------
// Finance Dashboard Summary
// ---------------------------------------------------------------------------

/** GET /finance/summary */
export const getFinanceSummary = catchAsync(
  async (req: Request, res: Response) => {
    const [paid, pending, sent, recentFees] = await Promise.all([
      (prisma as any).reportingFee.groupBy({
        by: ['currency'],
        where: { currentActionState: { in: ["PAID", "RECONCILED"] } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).reportingFee.groupBy({
        by: ['currency'],
        where: { currentActionState: "PROCESSING" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).reportingFee.groupBy({
        by: ['currency'],
        where: { currentActionState: "ISSUED" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).reportingFee.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { name: true, email: true } },
          report: { select: { year: true } },
        },
      }),
    ]);

    // Build summary per currency
    const currencies = Array.from(new Set([
      ...paid.map((p: any) => p.currency),
      ...pending.map((p: any) => p.currency),
      ...sent.map((p: any) => p.currency)
    ]));

    if (currencies.length === 0) currencies.push("ETB");

    const summaries = currencies.map((c) => {
      const pPaid = paid.find((p: any) => p.currency === c);
      const pPending = pending.find((p: any) => p.currency === c);
      const pSent = sent.find((p: any) => p.currency === c);

      return {
        currency: c,
        totalCollected: Number(pPaid?._sum?.amount) || 0,
        paidCount: pPaid?._count?.id || 0,
        pendingAmount: Number(pPending?._sum?.amount) || 0,
        pendingCount: pPending?._count?.id || 0,
        sentAmount: Number(pSent?._sum?.amount) || 0,
        sentCount: pSent?._count?.id || 0,
      };
    });

    sendSuccessResponse(res, { summaries, recentFees });
  }
);

// ---------------------------------------------------------------------------
// Reporting Fees CRUD
// ---------------------------------------------------------------------------

/** GET /finance/fees — paginated list with optional filters */
export const getReportingFees = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query._page) || 1;
    const limit = Number(req.query._limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.currentActionState = req.query.status;
    if (req.query.memberId) where.memberId = req.query.memberId;

    const [fees, total] = await Promise.all([
      (prisma as any).reportingFee.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, email: true, memberCategory: true, type: true } },
          report: { select: { id: true, year: true, bankReference: true, crv: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      (prisma as any).reportingFee.count({ where }),
    ]);

    sendPaginatedResponse(res, { fees }, { page, limit, total });
  }
);

/** GET /finance/fees/preview — preview fee for a member before reporting */
export const getFeePreview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { memberId, reportRequestId } = req.query;

    if (!memberId) {
      return next(new AppError("memberId is required", 400));
    }

    const preview = await previewFee(
      memberId as string,
      (reportRequestId as string) || null
    );

    sendSuccessResponse(res, { preview });
  }
);

/** GET /finance/public/verify/:feeId — verify fee legitimacy */
export const verifyFeePublic = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { feeId } = req.params;

    if (!feeId) {
      return next(new AppError("Fee ID is required", 400));
    }

    const fee = await (prisma as any).reportingFee.findUnique({
      where: { id: feeId },
      include: {
        member: { select: { name: true, nameEn: true, certificateNo: true } },
        report: { select: { year: true, crv: true, bankReference: true } },
      },
    });

    if (!fee) {
      return sendSuccessResponse(res, { isValid: false, message: "Receipt/Invoice not found" });
    }

    sendSuccessResponse(res, {
      isValid: true,
      fee: {
        id: fee.id,
        amount: fee.amount,
        currency: fee.currency,
        status: fee.currentActionState,
        paidAt: fee.paidAt,
        createdAt: fee.createdAt,
        member: fee.member,
        report: fee.report,
      }
    });
  }
);

/** POST /finance/fees/generate — generate a fee for a given reportId */
export const generateFee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reportId } = req.body;

    if (!reportId) {
      return next(new AppError("reportId is required", 400));
    }

    // Load the report with member and their category
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        member: {
          include: {
            memberCategory: true,
          },
        },
        reportingFee: true,
      },
    });

    if (!report) {
      return next(new AppError(`Report with ID ${reportId} not found`, 404));
    }
    if (!report.memberId || !report.member) {
      return next(
        new AppError("Fee generation is only supported for member reports", 400)
      );
    }
    if (report.reportingFee) {
      return next(
        new AppError("A fee has already been generated for this report", 409)
      );
    }

    // Look up the fee rate for the member's category
    let amount = 0;
    let currency = "ETB";
    if (report.member.memberCategoryId) {
      const rate = await (prisma as any).categoryFeeRate.findUnique({
        where: { categoryId: report.member.memberCategoryId },
      });
      if (rate) {
        amount = Number(rate.amount);
        currency = rate.currency || "ETB";
      }
    }

    if (amount <= 0) {
      return next(
        new AppError(
          "No fee rate configured for this member's category. Please set a rate in Finance → Settings first.",
          422
        )
      );
    }

    const fee = await (prisma as any).reportingFee.create({
      data: {
        reportId,
        memberId: report.memberId,
        amount,
        currency,
        currentActionState: "DRAFT",
      },
      include: {
        member: { select: { id: true, name: true, email: true } },
        report: { select: { id: true, year: true, crv: true } },
      },
    });

    sendSuccessResponse(res, { fee }, 201);
  }
);

/** PATCH /finance/fees/:id/send — mark as SENT + email the church */
export const sendFee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const existing = await (prisma as any).reportingFee.findUnique({
      where: { id: req.params.id },
      include: {
        member: { select: { name: true, email: true } },
        report: { select: { year: true } },
      },
    });

    if (!existing) {
      return next(new AppError(`Fee with ID ${req.params.id} not found`, 404));
    }
    if (existing.currentActionState === "PAID" || existing.currentActionState === "RECONCILED") {
      return next(new AppError("Fee is already marked as Paid", 400));
    }

    const fee = await (prisma as any).reportingFee.update({
      where: { id: req.params.id },
      data: { currentActionState: "ISSUED", sentAt: new Date() },
      include: {
        member: { select: { id: true, name: true, email: true } },
        report: { select: { id: true, year: true, bankReference: true } },
      },
    });

    const reqAny = req as any;
    const staffId = reqAny.staff?.id as string | undefined;
    if (staffId) {
      await (prisma as any).actionState.create({
        data: {
          entityType: "PAYMENT",
          entityId: fee.id,
          state: "ISSUED",
          performedBy: staffId,
        },
      });
    }

    // Send email notification (fire-and-forget; don't fail the request if email errors)
    if (existing.member?.email) {
      sendFeeEmail({
        to: existing.member.email,
        memberName: existing.member.name,
        year: existing.report.year,
        amount: Number(existing.amount),
        currency: existing.currency,
        feeId: existing.id,
      }).catch((err) =>
        console.error("[Finance] Failed to send fee email:", err)
      );
    }

    sendSuccessResponse(res, { fee });
  }
);

/** PATCH /finance/fees/:id/pay — mark as PAID and optionally update the linked report */
export const markFeePaid = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { note } = req.body;

    const existing = await (prisma as any).reportingFee.findUnique({
      where: { id: req.params.id },
      include: { report: true },
    });

    if (!existing) {
      return next(new AppError(`Fee with ID ${req.params.id} not found`, 404));
    }
    if (existing.currentActionState === "PAID" || existing.currentActionState === "RECONCILED") {
      return next(new AppError("Fee is already marked as Paid", 400));
    }

    // Update fee status to PAID
    const fee = await (prisma as any).reportingFee.update({
      where: { id: req.params.id },
      data: {
        currentActionState: "PAID",
        paidAt: new Date(),
        ...(note ? { note } : {}),
      },
      include: {
        member: { select: { id: true, name: true, email: true } },
        report: { select: { id: true, year: true, bankReference: true } },
      },
    });

    const reqAny = req as any;
    const staffId = reqAny.staff?.id as string | undefined;
    if (staffId) {
      await (prisma as any).actionState.create({
        data: {
          entityType: "PAYMENT",
          entityId: fee.id,
          state: "PAID",
          performedBy: staffId,
        },
      });
    }

    sendSuccessResponse(res, { fee });
  }
);

/** POST /finance/verify — verify a payment via external gateway */
export const verifyPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reference, suffix, phoneNumber } = req.body;

    if (!reference) {
      return next(new AppError("Reference is required for verification", 400));
    }

    const verificationResult = await verifyPaymentWithGateway({
      reference,
      suffix,
      phoneNumber,
    });

    // 1. Check if transaction number is already used
    if (verificationResult.receiptNo) {
      const existingReport = await prisma.report.findFirst({
        where: { bankReference: verificationResult.receiptNo },
      });
      if (existingReport) {
        return next(new AppError(`The transaction number ${verificationResult.receiptNo} has already been used for another report.`, 400));
      }
    }

    // 2. Check if the recipient name matches the configured account names
    if (verificationResult.creditedPartyName) {
      const paymentConfigs = await prisma.paymentMethodConfig.findMany({
        where: { isEnabled: true },
      });
      const validNames = paymentConfigs
        .map(c => c.accountName?.trim().toLowerCase())
        .filter(Boolean) as string[];
        
      if (validNames.length > 0) {
        const incomingName = verificationResult.creditedPartyName.trim().toLowerCase();
        // Allow a match if one string contains the other (e.g. "ECGBC" vs "ECGBC HEAD OFFICE")
        const isMatch = validNames.some(name => incomingName.includes(name) || name.includes(incomingName));
        
        if (!isMatch) {
          return next(new AppError(`The recipient name on the receipt (${verificationResult.creditedPartyName}) does not match our configured account name.`, 400));
        }
      }
    }

    sendSuccessResponse(res, { verification: verificationResult });
  }
);
