import React from "react";
import { Badge } from "@/components/ui";

interface FeeStatusBadgeProps {
  status: "PENDING" | "SENT" | "PAID";
}

export function FeeStatusBadge({ status }: FeeStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "SENT":
      return <Badge variant="info">Sent / Invoiced</Badge>;
    case "PAID":
      return <Badge variant="success">Paid</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
