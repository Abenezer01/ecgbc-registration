import { NextFunction, Request, Response } from "express";
import prisma from "../../config/db.config";
import { catchAsync } from "../../config/error.config";
import AppError from "../../shared/errors/app.error";
import { sendPaginatedResponse, sendSuccessResponse } from "../../shared/helpers/response.helper";
import { getValidStates, isValidState } from "./action-state.enum";
import { logActivity, ActivityAction } from "../../shared/services/activity.service";
import { sendReceiptEmail } from "../finance/controllers/finance.controller";

const ENTITY_TABLE_MAP: Record<string, { model: any; field: string }> = {
  MEMBER:     { model: "member",            field: "currentActionState" },
  FELLOWSHIP: { model: "councilFellowship", field: "currentActionState" },
  PAYMENT:    { model: "reportingFee",      field: "currentActionState" },
};

/**
 * GET /api/v1/action-states?entityType=MEMBER&entityId=:id
 * List full action state history for an entity
 */
export const getActionStates = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { entityType, entityId, _page = 1, _limit = 50 } = req.query;

    if (!entityType || !entityId) {
      return next(new AppError("entityType and entityId are required", 400));
    }

    const page = Number(_page);
    const limit = Number(_limit);
    const skip = (page - 1) * limit;

    const [actionStates, total] = await Promise.all([
      (prisma as any).actionState.findMany({
        where: { entityType: entityType as string, entityId: entityId as string },
        include: {
          staff: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { performedAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).actionState.count({
        where: { entityType: entityType as string, entityId: entityId as string },
      }),
    ]);

    sendPaginatedResponse(res, { actionStates }, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }
);

/**
 * POST /api/v1/action-states
 * Advance entity to a new state
 * body: { entityType, entityId, state, note? }
 */
export const createActionState = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { entityType, entityId, state, note } = req.body;
    const reqAny = req as any;
    const staffId = reqAny.staff?.id as string | undefined;

    if (!staffId) return next(new AppError("Unauthorized", 401));
    if (!entityType || !entityId || !state) {
      return next(new AppError("entityType, entityId, and state are required", 400));
    }
    if (!isValidState(entityType as string, state as string)) {
      const valid = getValidStates(entityType as string);
      return next(new AppError(`Invalid state "${state}" for entity "${entityType}". Valid states: ${valid.join(", ")}`, 400));
    }

    const actionState = await (prisma as any).actionState.create({
      data: {
        entityType,
        entityId,
        state,
        note: note || null,
        performedBy: staffId,
      },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Update denormalized currentActionState on the parent entity if supported
    const tableMap = ENTITY_TABLE_MAP[entityType as string];
    if (tableMap) {
      await (prisma as any)[tableMap.model].update({
        where: { id: entityId },
        data: { [tableMap.field]: state },
      });
    }

    await logActivity({
      action: ActivityAction.APPROVE,
      entity: entityType as string,
      entityId: entityId as string,
      description: `State advanced to ${state}${note ? `: ${note}` : ""}`,
      metadata: { state, note },
    }, req);

    // If payment is reconciled, generate CRV, set paidAmount, and send receipt email
    if (entityType === "PAYMENT" && state === "RECONCILED") {
      let fee = await (prisma as any).reportingFee.findUnique({
        where: { id: entityId },
        include: {
          member: { select: { name: true, email: true } },
          report: { select: { id: true, year: true, bankReference: true, crv: true } },
        },
      });

      if (fee && !fee.crv) {
        // Auto-generate CRV sequence
        const year = new Date().getFullYear();
        const sequence = await (prisma as any).cRVSequence.upsert({
          where: { year },
          update: { lastValue: { increment: 1 } },
          create: { year, lastValue: 1 },
        });
        const crvNumber = `CRV-${year}-${String(sequence.lastValue).padStart(4, '0')}`;

        // Update fee with CRV and paidAmount
        fee = await (prisma as any).reportingFee.update({
          where: { id: entityId },
          data: {
            crv: crvNumber,
            paidAmount: Number(fee.amount),
            paidAt: new Date()
          },
          include: {
            member: { select: { name: true, email: true } },
            report: { select: { id: true, year: true, bankReference: true, crv: true } },
          },
        });

        // Sync CRV to report for backward compatibility
        if (fee.report) {
          await prisma.report.update({
            where: { id: fee.report.id },
            data: { crv: crvNumber }
          });
        }
      }

      if (fee?.member?.email) {
        sendReceiptEmail({
          to: fee.member.email,
          memberName: fee.member.name,
          year: fee.report.year,
          amount: Number(fee.paidAmount || fee.amount),
          currency: fee.currency,
          feeId: fee.id,
          crv: fee.crv,
          bankReference: fee.report.bankReference,
        }).catch((err) => console.error("[ActionState] Failed to send receipt email:", err));
      }
    }

    sendSuccessResponse(res, { actionState });
  }
);
