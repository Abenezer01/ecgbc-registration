import React from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";

interface GenerateFeeDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string | null;
  onConfirm: (reportId: string) => void;
  isPending: boolean;
}

export function GenerateFeeDialog({
  open,
  onClose,
  reportId,
  onConfirm,
  isPending,
}: GenerateFeeDialogProps) {
  if (!reportId) return null;

  return (
    <Modal open={open} onClose={onClose} title="Generate Reporting Fee" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          This will generate a reporting fee for this annual report based on the
          member's category fee rate.
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          Note: If the member's category does not have a configured fee rate,
          this operation will fail. You can configure rates in Finance Settings.
        </p>
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(reportId)} disabled={isPending}>
          {isPending ? "Generating..." : "Generate Fee"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
