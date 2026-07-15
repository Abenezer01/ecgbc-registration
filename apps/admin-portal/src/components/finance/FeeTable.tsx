import React from "react";
import { DataTable, Button, Badge } from "@/components/ui";
import { ReportingFee } from "../../hooks/useFinance";
import { FeeStatusBadge } from "./FeeStatusBadge";
import { Send, CheckCircle } from "lucide-react";

interface FeeTableProps {
  fees: ReportingFee[];
  isLoading: boolean;
  onSendClick: (fee: ReportingFee) => void;
  onPayClick: (fee: ReportingFee) => void;
  onVerifyClick: (fee: ReportingFee) => void;
}

export function FeeTable({ fees, isLoading, onSendClick, onPayClick, onVerifyClick }: FeeTableProps) {
  const columns = [
    {
      key: "member",
      header: "Member / Category",
      cell: (row: ReportingFee) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-white">
            {row.member?.name || "Unknown"}
          </p>
          <p className="text-xs text-zinc-500">
            {row.member?.memberCategory?.description || "No Category"}
          </p>
        </div>
      ),
    },
    {
      key: "report",
      header: "Report Details",
      cell: (row: ReportingFee) => (
        <div>
          <p className="text-sm">
            {row.report?.year} E.C
          </p>
          {row.report?.bankReference && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              Bank Ref: {row.report.bankReference}
            </p>
          )}
          {row.report?.crv && (
            <p className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 inline-block mt-1">
              CRV: {row.report.crv}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row: ReportingFee) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {row.currency || 'ETB'} {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: ReportingFee) => <FeeStatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-40",
      cell: (row: ReportingFee) => (
        <div className="flex justify-end gap-2">
          {row.status === "PENDING" && (
            <Button
              onClick={() => onSendClick(row)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          )}
          {row.report?.bankReference && (
            <Button
              onClick={() => onVerifyClick(row)}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              Verify
            </Button>
          )}
          {(row.status === "SENT" || row.status === "PENDING") && (
            <Button
              onClick={() => onPayClick(row)}
              variant="primary"
              size="sm"
              className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-zinc-500">Loading fees...</div>;
  }

  if (fees.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">No reporting fees found.</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={fees} rowKey={(row) => row.id} />;
}
