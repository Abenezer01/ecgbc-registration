import axios from 'axios';
import AppError from '../../../shared/errors/app.error';

const VERIFY_API_URL = 'https://verifyapi.leulzenebe.pro/verify';

export interface VerifyPaymentPayload {
  reference: string;
  suffix?: string;
  phoneNumber?: string;
}

export const verifyPaymentWithGateway = async (payload: VerifyPaymentPayload) => {
  const apiKey = process.env.PAYMENT_VERIFY_API_KEY;
  if (!apiKey) {
    throw new AppError("Verification API Key (PAYMENT_VERIFY_API_KEY) is not configured in the environment", 500);
  }

  try {
    const response = await axios.post(
      VERIFY_API_URL,
      payload,
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    // The API wraps responses as { success: true, data: { ... } }
    const raw = response.data?.data ?? response.data;

    // Normalize: extract numeric value from strings like "40 Birr"
    const parseAmount = (val: string | number | undefined): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      return parseFloat(String(val).replace(/[^\d.]/g, '')) || 0;
    };

    // Telebirr uses: settledAmount, payerName, payerTelebirrNo, receiptNo, paymentDate, transactionStatus
    // CBE uses:      amount, senderName, referenceNumber, transactionDate, status (field names differ)
    const normalizedAmount = parseAmount(raw.settledAmount ?? raw.amount ?? raw.transactionAmount);
    const payerName = raw.payerName ?? raw.senderName ?? raw.accountName ?? null;
    const receiptNo = raw.receiptNo ?? raw.referenceNumber ?? raw.transactionRef ?? null;
    const paymentDate = raw.paymentDate ?? raw.transactionDate ?? raw.date ?? null;
    const transactionStatus = raw.transactionStatus ?? raw.status ?? null;

    return {
      payerName,
      receiptNo,
      paymentDate,
      transactionStatus,
      amount: normalizedAmount,
      totalPaid: parseAmount(raw.totalPaidAmount ?? raw.totalAmount),
      serviceFee: parseAmount(raw.serviceFee),
      creditedPartyName: raw.creditedPartyName ?? raw.receiverName ?? null,
      creditedPartyAccountNo: raw.creditedPartyAccountNo ?? raw.receiverAccount ?? null,
      bankName: raw.bankName ?? null,
      raw,
    };
  } catch (error: any) {
    console.error("[Verification API Error]", error.response?.data || error.message);
    throw new AppError(
      error.response?.data?.message || error.response?.data?.error || "Failed to verify payment with the gateway",
      error.response?.status || 400
    );
  }
};
