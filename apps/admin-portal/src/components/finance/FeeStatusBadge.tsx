import React from "react";
import { Badge } from "@/components/ui";

interface FeeStatusBadgeProps {
  status: string;
}

export function FeeStatusBadge({ status }: FeeStatusBadgeProps) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "ISSUED":
      return <Badge variant="warning">Issued / Invoiced</Badge>;
    case "PROCESSING":
      return <Badge variant="info">Processing</Badge>;
    case "PAID":
      return <Badge variant="success">Paid</Badge>;
    case "RECONCILED":
      return <Badge variant="success">Reconciled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
