import React from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { Topbar } from "../../components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
