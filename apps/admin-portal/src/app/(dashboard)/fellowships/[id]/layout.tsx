"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui";
import { useFellowship } from "@/hooks/useFellowships";

interface FellowshipDetailLayoutProps {
  children: React.ReactNode;
}

export default function FellowshipDetailLayout({ children }: FellowshipDetailLayoutProps) {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading Fellowship...</div>;
  }

  if (!fellowship) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Fellowship not found.
        <br />
        <Button variant="outline" className="mt-4" onClick={() => router.push("/fellowships")}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => router.push(`/fellowships`)} className="mb-2">
          ← Back to Fellowships
        </Button>

        {/* Hero Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
              <Globe className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
                  {fellowship.name}
                </h1>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${fellowship.isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                  {fellowship.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Fellowship</span>
                {fellowship.region && (
                  <span className="flex items-center gap-1.5 border-l border-zinc-300 dark:border-zinc-700 pl-4">
                    {fellowship.region.name || fellowship.region.id}
                  </span>
                )}
                {fellowship.certificateNo && (
                  <span className="flex items-center gap-1.5 border-l border-zinc-300 dark:border-zinc-700 pl-4 font-mono">
                    Reg: {fellowship.certificateNo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <Button variant="outline" onClick={() => {}} className="shadow-sm">Edit Fellowship</Button>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Member Churches</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{fellowship._count?.members || 0}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total Congregants</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">-</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Location</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{fellowship.city || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Page Content (Tabs inject here) */}
        {children}
      </div>
    </div>
  );
}
