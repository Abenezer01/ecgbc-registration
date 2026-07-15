"use client";

import React from "react";
import { FileText, Users, UserCheck, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";

interface StatsGridProps {
  member: any;
  documentCompleteness?: any;
}

export function StatsGrid({ member, documentCompleteness }: StatsGridProps) {
  const m = member as any;
  
  const stats = [
    {
      label: "Reports",
      value: m.reports?.length || 0,
      icon: <FileText className="h-5 w-5" />,
      color: "blue",
      description: "Total reports submitted"
    },
    {
      label: "Documents",
      value: documentCompleteness ? `${documentCompleteness.uploadedCount}/${documentCompleteness.totalRequired}` : "—",
      icon: documentCompleteness?.isComplete ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />,
      color: documentCompleteness?.isComplete ? "green" : "amber",
      description: documentCompleteness?.isComplete ? "All documents uploaded" : `${documentCompleteness?.missingDocuments.length || 0} missing`
    },
    {
      label: "Church Users",
      value: m.churchUsers?.length || 0,
      icon: <Users className="h-5 w-5" />,
      color: "purple",
      description: "Portal users"
    },
    {
      label: "Board Members",
      value: m.boardMembers?.length || 0,
      icon: <UserCheck className="h-5 w-5" />,
      color: "indigo",
      description: "Board members"
    },
    {
      label: "Member Since",
      value: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—",
      icon: <Calendar className="h-5 w-5" />,
      color: "zinc",
      description: "Join date"
    }
  ];

  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
    green: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
    zinc: "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          colorClass={colorClasses[stat.color as keyof typeof colorClasses]}
          description={stat.description}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, colorClass, description }: { label: string; value: string | number; icon: React.ReactNode; colorClass: string; description: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{value}</p>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{description}</p>
      </div>
    </div>
  );
}
