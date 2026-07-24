"use client";

import React from "react";
import { MapPin, Building2, Tag, Calendar, Shield } from "lucide-react";

interface QuickInfoRowProps {
  fellowship: any;
}

export function QuickInfoRow({ fellowship }: QuickInfoRowProps) {
  const f = fellowship as any;

  const infoItems = [
    {
      icon: <MapPin className="h-4 w-4" />,
      label: "Region",
      value: f.region?.name || "—"
    },
    {
      icon: <Building2 className="h-4 w-4" />,
      label: "City",
      value: f.city || "—"
    },
    {
      icon: <Tag className="h-4 w-4" />,
      label: "Certificate",
      value: f.certificateNo || "—"
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Established",
      value: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : "—"
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "Status",
      value: f.isActive ? "Active" : "Inactive"
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {infoItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
