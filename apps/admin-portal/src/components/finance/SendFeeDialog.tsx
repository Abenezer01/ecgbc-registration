import React from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";
import { ReportingFee } from "../../hooks/useFinance";

interface SendFeeDialogProps {
  open: boolean;
  onClose: () => void;
  fee: ReportingFee | null;
  onConfirm: (feeId: string) => void;
  isPending: boolean;
}

export function SendFeeDialog({
  open,
  onClose,
  fee,
  onConfirm,
  isPending,
}: SendFeeDialogProps) {
  if (!fee) return null;

  return (
    <Modal open={open} onClose={onClose} title="Send Reporting Fee" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You are about to send a reporting fee invoice to{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {fee.member?.name}
          </strong>{" "}
          for the {fee.report?.year} E.C annual report.
        </p>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-500">Amount:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {fee.currency || 'ETB'} {Number(fee.amount).toLocaleString()}
            </span>
          </div>
          {fee.member?.email && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Email:</span>
              <span className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">
                {fee.member.email}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          This will notify the member in their portal and send an email invoice
          (if an email is configured).
        </p>
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(fee.id)} disabled={isPending}>
          {isPending ? "Sending..." : "Send Invoice"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
