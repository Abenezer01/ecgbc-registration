"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Users, FileText, Phone, User, Globe } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import { useFellowship } from "@/hooks/useFellowships";
import { useAuth } from "@/hooks/useAuth";
import ActionStateTimeline from "@/components/action-state/ActionStateTimeline";

export default function FellowshipOverviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);
  const { hasPermission } = useAuth();

  const canViewReports = hasPermission("view_report") || hasPermission("view_member");
  const canManageUsers = hasPermission("view_church_user") || hasPermission("view_member");

  const tabs = [
    { id: "overview", label: "Overview", icon: <User />, path: `/fellowships/${id}/overview` },
    { id: "members", label: "Members", icon: <Building2 />, path: `/fellowships/${id}/members` },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/fellowships/${id}/reports`, visible: canViewReports },
    { id: "users", label: "Fellowship Users", icon: <Users />, path: `/fellowships/${id}/users`, visible: canManageUsers },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/fellowships/${id}/overview`;

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  if (!fellowship) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Fellowship not found.
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Approval Status */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-zinc-400" />
            Approval Status
          </h3>
          <ActionStateTimeline
            entityType="FELLOWSHIP"
            entityId={id}
            currentActionState={(fellowship as any).currentActionState}
          />
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" /> Fellowship Details
                </h3>
                <Card className="bg-zinc-50/50 dark:bg-zinc-800/20 border-none shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Name</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Region</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.region?.name || fellowship.region?.id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Certificate Number</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 font-mono">{fellowship.certificateNo || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" /> Contact & Location
                </h3>
                <Card className="bg-zinc-50/50 dark:bg-zinc-800/20 border-none shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Location / City</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.city || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Coverage</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.isInEthiopia !== false ? "Domestic (Ethiopia)" : "International / Diaspora"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {fellowship.contactPerson && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" /> Contact Person
                  </h3>
                  <Card className="bg-zinc-50/50 dark:bg-zinc-800/20 border-none shadow-none">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.contactPerson.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Phone Number</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.contactPerson.phoneNumber}</p>
                      </div>
                      {fellowship.contactPerson.email && (
                        <div>
                          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{fellowship.contactPerson.email}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
