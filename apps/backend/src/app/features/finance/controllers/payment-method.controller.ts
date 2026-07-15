import { Request, Response, NextFunction } from "express";
import prisma from "../../../config/db.config";
import { catchAsync } from "../../../config/error.config";
import { sendSuccessResponse } from "../../../shared/helpers/response.helper";

/**
 * GET /finance/payment-methods
 * Returns all PAYMENT_METHOD DataLookup entries joined with their config (if any)
 */
export const getPaymentMethods = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const methods = await prisma.dataLookup.findMany({
      where: { type: "PAYMENT_METHOD" },
      orderBy: { index: "asc" },
      include: { paymentMethodConfigs: true },
    });

    const result = methods.map((m) => ({
      id: m.id,
      value: m.value,
      description: m.description,
      note: m.note,
      isDefault: m.isDefault,
      config: m.paymentMethodConfigs[0] ?? null,
    }));

    sendSuccessResponse(res, { methods: result });
  }
);

/**
 * PUT /finance/payment-methods/:methodId
 * Upsert the config for a payment method (enable/disable, bank details, etc.)
 */
export const upsertPaymentMethodConfig = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { methodId } = req.params;
    const {
      isEnabled,
      accountName,
      accountNumber,
      bankName,
      phoneNumber,
      instructions,
    } = req.body;

    const config = await (prisma as any).paymentMethodConfig.upsert({
      where: { methodId },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(accountName !== undefined && { accountName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(bankName !== undefined && { bankName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(instructions !== undefined && { instructions }),
      },
      create: {
        methodId,
        isEnabled: isEnabled ?? true,
        accountName: accountName ?? null,
        accountNumber: accountNumber ?? null,
        bankName: bankName ?? null,
        phoneNumber: phoneNumber ?? null,
        instructions: instructions ?? null,
      },
    });

    sendSuccessResponse(res, { config });
  }
);

/**
 * GET /church-portal/payment-methods (public to church users)
 * Returns only enabled payment methods with their configs
 */
export const getEnabledPaymentMethods = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const methods = await prisma.dataLookup.findMany({
      where: { type: "PAYMENT_METHOD" },
      orderBy: { index: "asc" },
      include: { paymentMethodConfigs: true },
    });

    const result = methods
      .map((m) => ({
        id: m.id,
        value: m.value,
        description: m.description,
        note: m.note,
        config: m.paymentMethodConfigs[0] ?? null,
      }))
      .filter((m) => m.config === null || m.config.isEnabled);

    sendSuccessResponse(res, { methods: result });
  }
);
