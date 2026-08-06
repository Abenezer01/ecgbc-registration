"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, FileText, FolderOpen, ShieldAlert, Building2, AlertTriangle } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { useFellowship } from "@/hooks/useFellowships";
import { useAuth } from "@/hooks/useAuth";

export default function FellowshipSettingsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);
  const { hasPermission } = useAuth();

  const canViewMembers = hasPermission("view_member");
  const canViewReports = hasPermission("view_report");
  const canManageSettings = hasPermission("change_fellowship");
  const canDeactivate = hasPermission("deactivate_fellowship") || hasPermission("delete_fellowship");

  const tabs = [
    { id: "overview", label: "Overview", icon: <Building2 />, path: `/fellowships/${id}/overview` },
    { id: "members", label: "Members", icon: <Users />, path: `/fellowships/${id}/members`, visible: canViewMembers },
    { id: "reports", label: "Reports", icon: <FileText />, path: `/fellowships/${id}/reports`, visible: canViewReports },
    { id: "settings", label: "Settings", icon: <ShieldAlert />, path: `/fellowships/${id}/settings`, visible: canManageSettings },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);
  const currentPath = `/fellowships/${id}/settings`;

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

  const f = fellowship as any;

  const handleDeactivate = () => {
    if (window.confirm(`Are you sure you want to ${f.isActive ? 'deactivate' : 'activate'} this fellowship?`)) {
      // TODO: Implement deactivation/activation logic
      console.log("Toggle fellowship status");
    }
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${currentPath === tab.path 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }
                `}
              >
                {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "h-4 w-4" })}
                {tab.label}
                {currentPath === tab.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Management */}
          <Card className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    Fellowship Status
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {f.isActive 
                      ? "This fellowship is currently active and can submit reports and manage members."
                      : "This fellowship is currently inactive and cannot submit reports or manage members."
                    }
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      f.isActive 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}>
                      {f.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                {canDeactivate && (
                  <Button
                    variant={f.isActive ? "destructive" : "default"}
                    onClick={handleDeactivate}
                  >
                    {f.isActive ? "Deactivate Fellowship" : "Activate Fellowship"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warning Section */}
          {f.isActive && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Important Notice
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Deactivating a fellowship will prevent all members from accessing the system and submitting reports. This action should be carefully considered.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Settings */}
          <Card className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Additional Settings
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Additional fellowship settings will be implemented here, such as:
              </p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 space-y-1 list-disc list-inside">
                <li>Region assignment</li>
                <li>Contact information management</li>
                <li>Leadership team assignments</li>
                <li>Fees and payment settings</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
