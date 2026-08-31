"use client";

import React, { useState } from "react";
import { useReportingFees, useSendFee, useMarkFeePaid, useVerifyPayment, ReportingFee } from "../../../../hooks/useFinance";
import { FeeTable } from "../../../../components/finance/FeeTable";
import { SendFeeDialog } from "../../../../components/finance/SendFeeDialog";
import { MarkPaidDialog } from "../../../../components/finance/MarkPaidDialog";
import { VerifyPaymentDialog } from "../../../../components/finance/VerifyPaymentDialog";
import { Pagination } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";

export default function FinanceFeesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_finance");

  const { data, isLoading } = useReportingFees({ page, limit });
  const { mutateAsync: sendFee, isPending: sending } = useSendFee();
  const { mutateAsync: markPaid, isPending: paying } = useMarkFeePaid();
  const { mutateAsync: verifyPayment, isPending: verifying } = useVerifyPayment();

  // Dialog States
  const [sendOpen, setSendOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [selectedFee, setSelectedFee] = useState<ReportingFee | null>(null);

  const handleSendClick = (fee: ReportingFee) => {
    setSelectedFee(fee);
    setSendOpen(true);
  };

  const handlePayClick = (fee: ReportingFee) => {
    setSelectedFee(fee);
    setPayOpen(true);
  };

  const handleVerifyClick = (fee: ReportingFee) => {
    setSelectedFee(fee);
    setVerificationResult(null);
    setVerifyOpen(true);
  };

  const onConfirmSend = async (feeId: string) => {
    try {
      await sendFee({ feeId });
      setSendOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send fee");
    }
  };

  const onConfirmPay = async (feeId: string, note?: string) => {
    try {
      await markPaid({ feeId, note });
      setPayOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to mark fee as paid");
    }
  };

  const onConfirmVerify = async (reference: string) => {
    try {
      // The admin can manually input suffix if needed later,
      // but for now we rely on universal router auto-detection
      const res = await verifyPayment({ reference });
      setVerificationResult(res.verification);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to verify payment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <FeeTable
          fees={data?.fees || []}
          isLoading={isLoading}
          onSendClick={handleSendClick}
          onPayClick={handlePayClick}
          onVerifyClick={handleVerifyClick}
          canManage={canManage}
        />
        {data && data.total > limit && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <Pagination
              page={page}
              pageSize={limit}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <SendFeeDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        fee={selectedFee}
        onConfirm={onConfirmSend}
        isPending={sending}
      />

      <MarkPaidDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        fee={selectedFee}
        onConfirm={onConfirmPay}
        isPending={paying}
      />

      <VerifyPaymentDialog
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        fee={selectedFee}
        onVerify={onConfirmVerify}
        isPending={verifying}
        verificationResult={verificationResult}
      />
    </div>
  );
}