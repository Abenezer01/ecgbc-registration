import React from "react";
import { Avatar, Badge } from "@/components/ui";
import type { Column } from "@/components/ui";

function statusBadge(isActive: boolean, stateObj?: any) {
  // Try to use the state object description if available, fallback to isActive boolean
  const label = stateObj?.description || (isActive ? "Active" : "Inactive");
  const isOk = label.toLowerCase() === "active" || isActive;
  return (
    <Badge variant={isOk ? "success" : "danger"}>
      {label}
    </Badge>
  );
}

export const columns: Column<any>[] = [
  {
    key: "member",
    header: "Name",
    cell: (row) => {
      // The backend uses `name` for both Member and CouncilFellowship
      const nameStr = row.name || "Unknown";
      return (
        <div className="flex items-center gap-3">
          <Avatar fallback={nameStr[0]?.toUpperCase() || "?"} size="sm" />
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">
              {nameStr}
            </p>
            {row.kind === "member" && row.email && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.email}</p>
            )}
            {row.kind === "member" && row.certificateNo && (
              <p className="text-xs text-zinc-400 mt-0.5">Cert: {row.certificateNo}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: "fellowship",
    header: "Council Fellowship",
    cell: (row) =>
      row.kind === "fellowship" ? (
        <span className="text-zinc-400">—</span>
      ) : (
        row.councilFellowship?.name || row.fellowship?.name || <span className="text-zinc-400">—</span>
      ),
  },
  {
    key: "region",
    header: "Region",
    cell: (row) =>
      row.kind === "fellowship"
        ? row.region?.description || row.region?.name || <span className="text-zinc-400">—</span>
        : row.region?.description || row.fellowship?.region?.name || <span className="text-zinc-400">—</span>,
  },
  {
    key: "category",
    header: "Type",
    cell: (row) =>
      row.kind === "fellowship" ? (
        <Badge variant="secondary">Council Fellowship</Badge>
      ) : (
        row.type?.description || row.category?.name || <span className="text-zinc-400">—</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => statusBadge(row.isActive, row.state),
  },
];
