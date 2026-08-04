import React, { useState } from "react";
import { Modal, ModalFooter, Button, FormField, Input } from "@/components/ui";
import { ReportingFee } from "../../hooks/useFinance";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MarkPaidDialogProps {
  open: boolean;
  onClose: () => void;
  fee: ReportingFee | null;
  onConfirm: (feeId: string, note?: string, crv?: string) => void;
  isPending: boolean;
}

export function MarkPaidDialog({
  open,
  onClose,
  fee,
  onConfirm,
  isPending,
}: MarkPaidDialogProps) {
  const [note, setNote] = useState("");
  const [crv, setCrv] = useState("");

  React.useEffect(() => {
    if (open) {
      setNote("");
      setCrv("");
    }
  }, [open, fee]);

  if (!fee) return null;

  const canConfirm = crv.trim().length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Record Fee Payment" size="sm">
      <div className="space-y-4">
        {/* Fee summary */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900 truncate">{fee.member?.name}</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">
              {formatCurrency(fee.amount, fee.currency, 2)}
            </p>
            {fee.report?.year && (
              <p className="text-xs text-emerald-600 mt-0.5">Annual Report — {fee.report.year}</p>
            )}
            {fee.report?.bankReference && (
              <p className="text-xs font-mono text-emerald-600 mt-1 bg-emerald-100/50 p-1.5 rounded truncate">
                Bank Ref: {fee.report.bankReference}
              </p>
            )}
          </div>
        </div>

        <FormField id="crv" label="CRV Number" required>
          <Input
            id="crv"
            placeholder="e.g. CRV-12345"
            value={crv}
            onChange={(e) => setCrv(e.target.value)}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Cash Receipt Voucher number assigned by the finance office.
          </p>
        </FormField>

        <FormField id="note" label="Internal Notes (Optional)">
          <Input
            id="note"
            placeholder="e.g. Paid via CBE bank transfer"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormField>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onConfirm(fee.id, note || undefined, crv)}
          disabled={isPending || !canConfirm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
        >
          {isPending ? "Saving..." : "Confirm Payment"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
