import React from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";
import { CheckCircle } from "lucide-react";
import { ReportingFee } from "../../hooks/useFinance";
import { formatCurrency } from "@/lib/utils";

interface VerifyPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  fee: ReportingFee | null;
  onVerify: (reference: string) => void;
  isPending: boolean;
  verificationResult?: any;
}

export function VerifyPaymentDialog({
  open,
  onClose,
  fee,
  onVerify,
  isPending,
  verificationResult,
}: VerifyPaymentDialogProps) {
  if (!fee) return null;

  return (
    <Modal open={open} onClose={onClose} title="Verify Payment" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Verify the bank reference submitted by the church against the external payment gateway.
        </p>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Bank Reference:</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-white">
              {fee.report?.bankReference || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Expected Amount:</span>
            <span className="font-medium text-zinc-900 dark:text-white">
              {formatCurrency(fee.amount, fee.currency || "ETB")}
            </span>
          </div>
        </div>

        {verificationResult && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-900/30">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm w-full">
                <p className="font-semibold text-emerald-900 dark:text-emerald-400">Payment Verified</p>
                <div className="flex justify-between">
                  <span className="text-emerald-700 dark:text-emerald-500/80">Settled Amount:</span>
                  <span className="font-medium text-emerald-900 dark:text-emerald-400">{formatCurrency(verificationResult.amount, "ETB")}</span>
                </div>
                {verificationResult.payerName && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-500/80">Payer:</span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-400">{verificationResult.payerName}</span>
                  </div>
                )}
                {verificationResult.receiptNo && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-500/80">Receipt No:</span>
                    <span className="font-mono font-medium text-emerald-900 dark:text-emerald-400">{verificationResult.receiptNo}</span>
                  </div>
                )}
                {verificationResult.paymentDate && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-500/80">Date:</span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-400">{verificationResult.paymentDate}</span>
                  </div>
                )}
                {verificationResult.transactionStatus && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 dark:text-emerald-500/80">Status:</span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-400">{verificationResult.transactionStatus}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {verificationResult ? "Close" : "Cancel"}
        </Button>
        {!verificationResult && (
          <Button
            onClick={() => fee.report?.bankReference && onVerify(fee.report.bankReference)}
            disabled={isPending || !fee.report?.bankReference}
          >
            {isPending ? "Verifying..." : "Verify Now"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
